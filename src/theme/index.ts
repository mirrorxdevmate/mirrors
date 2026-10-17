// Design tokens mirrored from the Figma "DS · Foundations" variables.
export const colors = {
  primary: '#E07A5F',
  primaryPressed: '#C25E44',
  primaryDisabled: '#F2BCAE',
  primaryDeep: '#7A2E22',
  secondary: '#FFDBD2',
  base: '#EAF1F5',
  white: '#FFFFFF',
  grey100: '#F8F9FA',
  grey200: '#E9ECEF',
  grey300: '#DEE2E6',
  grey400: '#CED4DA',
  grey500: '#ADB5BD',
  grey600: '#787A7C',
  grey700: '#5B5F6A',
  grey800: '#343A40',
  grey900: '#131821',
  blue: '#107DF2',
  green: '#32BB08',
  red: '#F54141',
  orange: '#FF8F17',
  amber: '#F2A93B',
  gold500: '#DCC694',
  gold700: '#BEA56C',
  overlay: 'rgba(19,24,33,0.55)',
} as const;

export const text = {
  primary: colors.grey900,
  secondary: colors.grey700,
  tertiary: colors.grey600,
  brand: colors.primary,
  onBrand: colors.white,
  error: colors.red,
  success: colors.green,
};

export const gradients = {
  mirrorPlus: ['#3B8BF5', '#1B5FD1'] as const,
  premium: ['#F2B45A', '#D9822B'] as const,
  greeting: ['#5E1414', '#B9503E', '#E9957C', '#B9503E', '#5E1414'] as const,
};

export const radius = { sm: 8, md: 16, lg: 24, xl: 36, full: 999 };
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32 };

export const fonts = {
  display: 'Fraunces_400Regular_Italic',
  heading: 'Urbanist_700Bold',
  headingSemi: 'Urbanist_600SemiBold',
  headingRegular: 'Urbanist_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40 },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 32 },
  h3: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  h4: { fontFamily: fonts.headingSemi, fontSize: 16, lineHeight: 24 },
  bodyL: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyLM: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bodyM: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  bodyS: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  captionM: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.bodySemi, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' as const },
};
