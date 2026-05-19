const token = <Value extends string | number>(value: Value, description: string) => ({
  value,
  description,
});

export const colors = {
  dark: {
    background: token("#0D0F1A", "Void: main night screen background"),
    surface: token("#14172B", "Deep Ink: cards, bottom sheets, modals"),
    surfaceRaised: token("#1C2040", "Midnight: elevated cards and selected states"),
    primary: token("#7C6FCD", "Iris: primary buttons, active icons, breathing orb inner"),
    primaryGlow: token("#A89CE0", "Lavender: gradients, glow effects, progress rings"),
    accent: token("#5EC4D4", "Moonstone: success states, streak rings, highlights"),
    accentWarm: token("#E8C97A", "Dusk Gold: sunrise mode, morning screen, badges"),
    textPrimary: token("#EEF0FF", "Cloud: headings and main text"),
    textSecondary: token("#8A8FA8", "Mist: supporting text, labels, hints"),
    textTertiary: token("#4A4E6A", "Haze: inactive icons and placeholders"),
    danger: token("#FF6B6B", "Ember: errors and Rescue Me only"),
    divider: token("#1E2236", "Subtle separators and borders"),
    sheetHandle: token("#2A2E4A", "Bottom sheet handle bar"),
  },
  light: {
    background: token("#F7F5FF", "Dawn: morning mode background"),
    surface: token("#FFFFFF", "Parchment: light cards"),
    primary: token("#6B5EC4", "Adjusted Iris: light theme primary"),
    accent: token("#3BB8CA", "Sky: light theme highlights"),
    textPrimary: token("#1A1B2E", "Ink: light theme headings and body"),
    textSecondary: token("#5A607A", "Slate: light theme supporting text"),
  },
} as const;

export const spacing = {
  base: 8,
  xs: 8,
  sm: 16,
  screenPadding: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  bottomNavigationHeight: 80,
  bottomSheetHandleWidth: 32,
  bottomSheetHandleHeight: 4,
} as const;

export const radii = {
  button: 14,
  card: 20,
  pill: 9999,
} as const;

export const typography = {
  fontFamily: {
    primary: "Nunito",
    data: "Inter",
  },
  mobileFontFamily: {
    primary: {
      regular: "Nunito-400",
      semiBold: "Nunito-600",
      bold: "Nunito-700",
      extraBold: "Nunito-800",
    },
    data: {
      light: "Inter-300",
      regular: "Inter-400",
    },
  },
  fontAssets: {
    primary: {
      family: "Nunito",
      source: "Google Fonts",
      mobileAssetPattern: "apps/mobile/assets/fonts/Nunito-<weight>.ttf",
      weights: [400, 600, 700, 800],
    },
    data: {
      family: "Inter",
      source: "Google Fonts",
      mobileAssetPattern: "apps/mobile/assets/fonts/Inter-<weight>.ttf",
      weights: [300, 400],
    },
  },
  scale: {
    display: { family: "Nunito", size: 32, weight: 800, color: colors.dark.textPrimary.value },
    h1: { family: "Nunito", size: 24, weight: 700, color: colors.dark.textPrimary.value },
    h2: { family: "Nunito", size: 20, weight: 600, color: colors.dark.textPrimary.value },
    h3: { family: "Nunito", size: 17, weight: 600, color: colors.dark.textPrimary.value },
    bodyLarge: { family: "Nunito", size: 16, weight: 400, color: colors.dark.textPrimary.value },
    body: { family: "Nunito", size: 15, weight: 400, color: colors.dark.textSecondary.value },
    label: { family: "Nunito", size: 13, weight: 600, color: colors.dark.textSecondary.value },
    caption: { family: "Inter", size: 12, weight: 400, color: colors.dark.textTertiary.value },
    timer: { family: "Inter", size: 48, weight: 300, color: colors.dark.textPrimary.value },
  },
} as const;

export const motion = {
  easing: {
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    fade: "fade",
    subtlePulse: "subtle-pulse",
    softFade: "soft-fade",
    linearVolumeFade: "linear",
  },
  duration: {
    screenEnterMs: 400,
    screenExitMs: 300,
    progressRingUpdateMs: 300,
    tabActiveIndicatorMs: 250,
    phaseLabelCrossfadeLeadMs: 200,
    windDownTransitionMs: 5000,
    sleepSoundUiIdleFadeMs: 30000,
    sleepTimerFadeOutMs: 120000,
  },
  breathingOrb: {
    restScale: 1,
    inhaleScale: 1.18,
  },
} as const;

export const uiTokens = {
  color: colors,
  spacing,
  radii,
  typography,
  motion,
} as const;
