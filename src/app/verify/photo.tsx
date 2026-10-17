import { VerifyStep } from '@/components/VerifyStep';

export default function PhotoVerification() {
  return (
    <VerifyStep
      kind="photo"
      title="Photo verification"
      steps={['1 · Centre your face in the frame', '2 · Follow the pose shown on screen', '3 · Nobody else sees this photo']}
      cta="Start verification"
      checking="Checking your photo…"
    />
  );
}
