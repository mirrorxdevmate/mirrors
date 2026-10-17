import { VerifyStep } from '@/components/VerifyStep';

export default function IdentityVerification() {
  return (
    <VerifyStep
      kind="identity"
      title="Identity verification"
      steps={['1 · Use a valid passport, national ID or driving licence', '2 · Place it on a flat, well-lit surface', '3 · Make sure all four corners are visible']}
      note="Your identity information is not shown publicly. We store a verified/not-verified result, nothing else on your profile."
      cta="Verify identity"
      checking="Checking your identity…"
    />
  );
}
