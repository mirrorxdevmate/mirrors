/** Clock read kept outside components so render stays pure. */
export const nowMs = () => Date.now();

export function ageFrom(d: string, m: string, y: string) {
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  if (dt.getDate() !== Number(d) || dt.getMonth() !== Number(m) - 1) return null;
  const now = new Date();
  let age = now.getFullYear() - dt.getFullYear();
  if (now.getMonth() < dt.getMonth() || (now.getMonth() === dt.getMonth() && now.getDate() < dt.getDate())) age--;
  return age;
}

export const fmtDate = (ms: number | null | undefined) =>
  ms ? new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, s: sec, text: `${h}h ${String(m).padStart(2, '0')}m`, clock: [h, m, sec].map((x) => String(x).padStart(2, '0')).join(':') };
}

export const toFtIn = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
};
