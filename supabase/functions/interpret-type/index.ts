// Turns a free-text "who catches your attention" description into editable traits.
// Uses Gemini (GEMINI_API_KEY) or Claude (ANTHROPIC_API_KEY) when set; otherwise a keyword parser.
import { caller, cors, json } from '../_shared/auth.ts';

type Trait = { key: string; label: string; value: string };

function heuristic(text: string, interestedIn: string) {
  const t = text.toLowerCase();
  const range = t.match(/(\d{2})\s*(?:-|–|to|and)\s*(\d{2})/);
  let ageMin = 30;
  let ageMax = 40;
  if (range) {
    ageMin = Math.max(18, Math.min(+range[1], +range[2]));
    ageMax = Math.min(80, Math.max(+range[1], +range[2]));
  } else {
    const single = t.match(/(?:around|about|age)\s*(\d{2})/);
    if (single) {
      ageMin = Math.max(18, +single[1] - 4);
      ageMax = +single[1] + 4;
    }
  }
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const gender = interestedIn === 'Woman' ? 'Woman' : interestedIn === 'Everyone' ? 'Everyone' : 'Man';
  const traits: Trait[] = [
    { key: 'gender', label: 'Gender', value: gender },
    { key: 'age', label: 'Age', value: `${ageMin}-${ageMax}` },
    { key: 'culture', label: 'Culture', value: has('same culture', 'my culture', 'arab', 'desi', 'religious') ? 'Shared' : 'Open' },
    { key: 'lifestyle', label: 'Lifestyle', value: has('ambitious', 'driven', 'career', 'successful') ? 'Ambitious' : has('active', 'gym', 'fit', 'sport') ? 'Active' : has('calm', 'chill', 'relaxed') ? 'Easy-going' : 'Balanced' },
    { key: 'family', label: 'Family', value: has('family', 'kids', 'children') ? 'Important' : 'Open' },
    { key: 'relationship', label: 'Relationship', value: has('casual', 'fun') && !has('serious') ? 'Casual' : 'Serious' },
  ];
  if (has('kind', 'caring', 'gentle')) traits.push({ key: 'personality', label: 'Personality', value: 'Kind' });
  else if (has('funny', 'humor', 'humour', 'laugh')) traits.push({ key: 'personality', label: 'Personality', value: 'Funny' });
  if (has('tall')) traits.push({ key: 'appearance', label: 'Appearance', value: 'Tall' });
  if (has('faith', 'religious', 'pray')) traits.push({ key: 'faith', label: 'Faith', value: 'Practising' });
  return { traits, ageMin, ageMax };
}

const SYSTEM =
  'You extract dating preferences from a user description. Reply with JSON only: ' +
  '{"ageMin":number,"ageMax":number,"traits":[{"key":string,"label":string,"value":string}]}. ' +
  'Always include keys gender, age, culture, lifestyle, family, relationship (values 1-2 words, Title Case). ' +
  'When the description does not mention one of these, use the value "Open". ' +
  'Add up to 3 more traits only if clearly stated (e.g. personality, appearance, faith, career). Never invent facts.';

function validate(raw: string) {
  const out = JSON.parse(raw.replace(/^```(?:json)?|```$/g, '').trim());
  if (!Array.isArray(out.traits) || typeof out.ageMin !== 'number' || typeof out.ageMax !== 'number') throw new Error('bad shape');
  out.ageMin = Math.max(18, Math.round(out.ageMin));
  out.ageMax = Math.max(out.ageMin, Math.min(99, Math.round(out.ageMax)));
  out.traits = out.traits
    .filter((t: Trait) => t && typeof t.key === 'string' && typeof t.label === 'string' && typeof t.value === 'string')
    .slice(0, 9);
  return out as { traits: Trait[]; ageMin: number; ageMax: number };
}

// Fast, cheap model by default; falls back to Google's rolling alias if a pinned model is retired.
const GEMINI_MODELS = [Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

async function withGemini(text: string, interestedIn: string, key: string) {
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `They want to meet: ${interestedIn || 'anyone'}.\nDescription: ${text}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 2048 },
      }),
    });
    if (res.status === 404) {
      lastError = `${model} not available`;
      continue;
    }
    if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    // Thinking models return "thought" parts first; only the answer parts matter.
    const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
    return validate(parts.filter((p) => !p.thought).map((p) => p.text ?? '').join(''));
  }
  throw new Error(lastError || 'no gemini model available');
}

async function withClaude(text: string, interestedIn: string, key: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5',
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: 'user', content: `They want to meet: ${interestedIn || 'anyone'}.\nDescription: ${text}` }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = await res.json();
  return validate(String(data.content?.[0]?.text ?? ''));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!(await caller(req))) return json({ error: 'unauthorized' }, 401);
  const { text = '', interestedIn = '' } = await req.json().catch(() => ({}));
  const clean = String(text).slice(0, 1000);
  const gemini = Deno.env.get('GEMINI_API_KEY');
  if (gemini) {
    try {
      return json(await withGemini(clean, String(interestedIn), gemini));
    } catch (e) {
      console.error('gemini failed, using fallback', e);
    }
  }
  const claude = Deno.env.get('ANTHROPIC_API_KEY');
  if (claude) {
    try {
      return json(await withClaude(clean, String(interestedIn), claude));
    } catch (e) {
      console.error('claude failed, using fallback', e);
    }
  }
  return json(heuristic(clean, String(interestedIn)));
});
