/**
 * WearLog design tokens — "Photo-first wardrobe editorial" (D-004).
 * Warm off-white canvas, white rounded cards with a faint lift, and ONE accent: ink black.
 * Clothes photos and garment vectors are the most colorful thing on screen; UI chrome stays neutral
 * so it never shifts how a garment color reads. Sky blue is reserved for weather surfaces only.
 * Rules: docs/DESIGN_SYSTEM.md. Screens must not define their own colors/spacings.
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  border: string;
  borderStrong: string;
  /** Ink CTA fill (시작하기 / 코디 저장하기 / 등록하기). */
  accent: string;
  accentPressed: string;
  accentSoft: string;
  /** Selected segment / chip fill. */
  selected: string;
  selectedText: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  heart: string;
  scrim: string;
  /** Neutral backdrop behind garment photos/vectors — never tinted, so colors read true. */
  photoBackdrop: string;
  /** Weather card gradient + its text. Weather surfaces only. */
  weatherFrom: string;
  weatherTo: string;
  weatherText: string;
  /** Rain-cloud / weather glyph tint on the weather card. */
  weatherIcon: string;
  /** Bottom tab bar: inactive icon/label. */
  tabInactive: string;
  /** Source badges: 샘플 vs 내 옷 (always paired with a text label). */
  badgeSampleBg: string;
  badgeSampleText: string;
  badgeOwnedBg: string;
  badgeOwnedText: string;
}

/** Third-party brand buttons (official brand colors; see docs/SOCIAL_AUTH_SETUP.md for guideline links). */
export const brandButtons = {
  kakao: { background: '#FEE500', text: '#191919' },
  google: { background: '#FFFFFF', text: '#1F1F1F', border: '#DADCE0' },
} as const;

/** Splash over the hanger-rack photo: fixed light palette in both themes (the photo is light). */
export const splashColors = { wall: '#ECEAE6', wallClear: 'rgba(236,234,230,0)', wallFade: 'rgba(236,234,230,0.95)', ink: '#1A1A1A', onInk: '#FFFFFF', sub: '#3A3A38', glass: 'rgba(255,255,255,0.55)' } as const;

export const lightColors: ColorTokens = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F1F0EC',
  textPrimary: '#1A1A1A',
  textSecondary: '#5E5E5B',
  textTertiary: '#8C8C88',
  textOnAccent: '#FFFFFF',
  border: '#E7E5E0',
  borderStrong: '#D3D1CB',
  accent: '#1A1A1A',
  accentPressed: '#333333',
  accentSoft: '#EDECE8',
  selected: '#1A1A1A',
  selectedText: '#FFFFFF',
  success: '#2F7A52',
  successSoft: '#E6F2EA',
  warning: '#8A5A00',
  warningSoft: '#FBF1DC',
  error: '#B83A32',
  errorSoft: '#FBE9E7',
  heart: '#E5484D',
  scrim: 'rgba(0,0,0,0.45)',
  photoBackdrop: '#F1F0EC',
  weatherFrom: '#EEF5FB',
  weatherTo: '#DCEAF6',
  weatherText: '#1A1A1A',
  weatherIcon: '#9FB6CB',
  tabInactive: '#8C8C88',
  badgeSampleBg: '#EDECE8',
  badgeSampleText: '#5E5E5B',
  badgeOwnedBg: '#1A1A1A',
  badgeOwnedText: '#FFFFFF',
};

export const darkColors: ColorTokens = {
  background: '#111111',
  surface: '#1B1B1A',
  surfaceElevated: '#242423',
  surfaceSunken: '#0A0A0A',
  textPrimary: '#F3F2EF',
  textSecondary: '#AEADA8',
  textTertiary: '#83827E',
  textOnAccent: '#111111',
  border: '#2B2B29',
  borderStrong: '#3D3D3A',
  accent: '#F3F2EF',
  accentPressed: '#D9D8D4',
  accentSoft: '#2A2A28',
  selected: '#F3F2EF',
  selectedText: '#111111',
  success: '#6CC596',
  successSoft: '#13291C',
  warning: '#E8B54A',
  warningSoft: '#2E240E',
  error: '#FF8A80',
  errorSoft: '#3A1715',
  heart: '#FF6369',
  scrim: 'rgba(0,0,0,0.65)',
  // Garment backdrop stays an untinted neutral gray in dark mode so garment colors are not shifted.
  photoBackdrop: '#2A2A28',
  weatherFrom: '#1B2834',
  weatherTo: '#16222D',
  weatherText: '#D4E5F5',
  weatherIcon: '#8FA9C2',
  tabInactive: '#83827E',
  badgeSampleBg: '#2A2A28',
  badgeSampleText: '#AEADA8',
  badgeOwnedBg: '#F3F2EF',
  badgeOwnedText: '#111111',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  /** Wardrobe grid tiles. */
  photo: 12,
  /** Large cards (weather, best outfit, recommendation hero). */
  tile: 16,
  chip: 999,
  /** Text fields, inline messages. Buttons are pills (`chip`). */
  field: 12,
  card: 20,
  sheet: 24,
} as const;

export const elevation = {
  raised: { shadowColor: '#1A1A1A', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  card: { shadowColor: '#1A1A1A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
} as const;

/**
 * Font families loaded at startup (src/app/_layout.tsx). Each weight is its own family so Android
 * never fakes bold — set `fontFamily`, not `fontWeight`. Pretendard (SIL OFL 1.1) for everything,
 * including the wordmark (no second font to license or ship).
 */
export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export function fontForWeight(weight: string | number | undefined): string {
  const w = weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : Number(weight);
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  if (w >= 500) return fonts.medium;
  return fonts.regular;
}

export const typography = {
  /** Wordmark "WearLog" (splash, login). */
  brand: { fontSize: 34, lineHeight: 40, fontFamily: fonts.semibold, letterSpacing: -0.8 },
  screenTitle: { fontSize: 24, lineHeight: 32, fontFamily: fonts.bold, letterSpacing: -0.4 },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.bold, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontFamily: fonts.bold, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fonts.semibold },
  secondary: { fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  label: { fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
  caption: { fontSize: 11, lineHeight: 15, fontFamily: fonts.medium },
  /** Big temperature on the weather card. */
  temperature: { fontSize: 44, lineHeight: 50, fontFamily: fonts.semibold, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  numeric: { fontSize: 18, lineHeight: 24, fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
} as const;

/** Minimum touch target (pt). */
export const touchTarget = 44;

export const bottomBarMaxHeight = 96;

/** Custom bottom tab bar content height (excluding the safe-area inset). */
export const tabBarHeight = 58;

/** Content column cap so cards don't grow huge on tablets / the web preview. */
export const contentMaxWidth = 640;

/** Wardrobe grid columns (showcase: 3-up tiles). */
export const wardrobeColumns = 3;
