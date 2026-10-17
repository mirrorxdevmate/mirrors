import { router } from 'expo-router';
import { useState } from 'react';

import { PhotoGrid } from '@/components/PhotoGrid';
import { StepScreen } from '@/components/step';
import { T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function Photos() {
  const saved = useApp((s) => s.profile.photos);
  const updateProfile = useApp((s) => s.updateProfile);
  const [photos, setPhotos] = useState(saved);
  const [error, setError] = useState(false);

  return (
    <StepScreen
      step={6}
      total={8}
      title="Add your photos"
      sub="At least 1 photo of your face. Add up to 6. The first is your main photo."
      onContinue={() => {
        if (!photos.length) return setError(true);
        updateProfile({ photos });
        router.push('/onboarding/intent');
      }}>
      <PhotoGrid
        photos={photos}
        error={error}
        onChange={(p) => {
          setPhotos(p);
          if (p.length) setError(false);
        }}
      />
      {error ? (
        <T v="body" color={colors.red} style={{ marginTop: 14 }}>
          You&apos;ll need at least one photo to continue.
        </T>
      ) : null}
    </StepScreen>
  );
}
