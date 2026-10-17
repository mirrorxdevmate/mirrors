import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { Button, Header, Option, ProgressHeader, Screen, T, Title } from './ui';
import { colors } from '@/theme';

/** Scaffold shared by every numbered onboarding step (progress, title, sticky Continue/Skip). */
export function StepScreen({
  step,
  total,
  title,
  sub,
  canContinue = true,
  onContinue,
  onSkip,
  children,
  scroll = true,
  loading,
  cta = 'Continue',
}: {
  step: number;
  total: number;
  title: string;
  sub?: string;
  canContinue?: boolean;
  onContinue: () => void;
  onSkip?: () => void;
  children?: React.ReactNode;
  scroll?: boolean;
  loading?: boolean;
  cta?: string;
}) {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  return (
    <Screen
      scroll={scroll}
      footer={
        <>
          <Button title={edit ? 'Save' : cta} disabled={!canContinue} loading={loading} onPress={onContinue} />
          {onSkip && !edit ? <Button title="Skip" variant="ghost" onPress={onSkip} /> : null}
        </>
      }>
      {edit ? <Header /> : <ProgressHeader step={step} total={total} />}
      <Title sub={sub}>{title}</Title>
      {children}
    </Screen>
  );
}

export function SingleSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <>
      {options.map((o) => (
        <Option key={o} label={o} selected={value === o} onPress={() => onChange(o)} />
      ))}
    </>
  );
}

export function MultiSelect({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <>
      {options.map((o) => (
        <Option
          key={o}
          multi
          label={o}
          selected={value.includes(o)}
          onPress={() => {
            if (value.includes(o)) onChange(value.filter((x) => x !== o));
            else if (!max || value.length < max) onChange([...value, o]);
          }}
        />
      ))}
    </>
  );
}

export const Hint = ({ children }: { children: string }) => (
  <T v="caption" color={colors.grey600} style={{ marginTop: 4 }}>
    {children}
  </T>
);

export const go = (path: string) => router.push(path as never);

/** In onboarding a step pushes the next one; opened from Settings (`?edit=1`) it saves and returns. */
export function useStepNav(next: string) {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  return { edit: !!edit, advance: () => (edit ? router.back() : router.push(next as never)) };
}
