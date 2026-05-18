const en = {
  common: {
    appName: "Nidoru",
    continue: "Continue",
  },
  home: {
    greeting: "Good evening",
    primaryActionTitle: "Start tonight's wind-down",
    primaryActionSubtitle: "4 min breathwork + sleep sounds",
    rescueActionTitle: "Rescue Me",
    rescueActionSubtitle: "Anxiety, panic, overwhelm",
  },
  breath: {
    phaseInhale: "Inhale",
    phaseHold: "Hold",
    phaseSecondInhale: "Inhale again",
    phaseExhale: "Exhale",
  },
  session: {
    firstValueTitle: "Let's wind down",
    completedTitle: "Session complete",
    completedSubtitle: "You completed your breath cycles.",
  },
} as const;

type WidenStrings<Messages> = {
  readonly [Key in keyof Messages]: Messages[Key] extends string
    ? string
    : WidenStrings<Messages[Key]>;
};

export type LocaleMessages = WidenStrings<typeof en>;

const es = {
  common: {
    appName: "Nidoru",
    continue: "Continuar",
  },
  home: {
    greeting: "Buenas noches",
    primaryActionTitle: "Empieza tu descanso de hoy",
    primaryActionSubtitle: "4 min de respiracion + sonidos para dormir",
    rescueActionTitle: "Ayudame ahora",
    rescueActionSubtitle: "Ansiedad, panico, agobio",
  },
  breath: {
    phaseInhale: "Inhala",
    phaseHold: "Sosten",
    phaseSecondInhale: "Inhala otra vez",
    phaseExhale: "Exhala",
  },
  session: {
    firstValueTitle: "Vamos a bajar el ritmo",
    completedTitle: "Sesion completa",
    completedSubtitle: "Completaste tus ciclos de respiracion.",
  },
} as const satisfies LocaleMessages;

const ptBR = {
  common: {
    appName: "Nidoru",
    continue: "Continuar",
  },
  home: {
    greeting: "Boa noite",
    primaryActionTitle: "Comece o descanso de hoje",
    primaryActionSubtitle: "4 min de respiracao + sons para dormir",
    rescueActionTitle: "Me ajuda agora",
    rescueActionSubtitle: "Ansiedade, panico, sobrecarga",
  },
  breath: {
    phaseInhale: "Inspire",
    phaseHold: "Segure",
    phaseSecondInhale: "Inspire de novo",
    phaseExhale: "Expire",
  },
  session: {
    firstValueTitle: "Vamos desacelerar",
    completedTitle: "Sessao completa",
    completedSubtitle: "Voce completou seus ciclos de respiracao.",
  },
} as const satisfies LocaleMessages;

export const locales = ["en", "es", "pt-BR"] as const;

export const messages = {
  en,
  es,
  "pt-BR": ptBR,
} as const satisfies Record<(typeof locales)[number], LocaleMessages>;

export type Locale = (typeof locales)[number];
export type MessageNamespace = keyof LocaleMessages;
export type MessageKey<Namespace extends MessageNamespace> = keyof LocaleMessages[Namespace];
