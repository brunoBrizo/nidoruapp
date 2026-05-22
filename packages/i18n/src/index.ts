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
    techniques: {
      "4-7-8-sleep": {
        name: "4-7-8 Sleep",
        description: "A bedtime and Rescue Me cadence with a long exhale.",
        primaryContext: "Before bed and Rescue Me",
      },
      "box-breathing": {
        name: "Box Breathing",
        description: "A steady square cadence for anxiety, calm, and focus.",
        primaryContext: "Anxiety and stress",
      },
      "coherent-breathing": {
        name: "Coherent Breathing",
        description: "A 5.5-second inhale and exhale practice for Daily Calm HRV training.",
        primaryContext: "Daily Calm / HRV Training",
      },
      "diaphragmatic-breathing": {
        name: "Diaphragmatic Breathing",
        description: "A simple belly-breathing cadence for stress relief.",
        primaryContext: "Stress relief",
      },
      "physiological-sigh": {
        name: "Physiological Sigh",
        description: "A double-inhale reset kept as a post-MVP replacement candidate.",
        primaryContext: "Panic or acute stress",
      },
    },
    audioCueModes: {
      none: {
        label: "None",
      },
      gentleBell: {
        label: "Gentle bell",
      },
      softWhoosh: {
        label: "Soft whoosh",
      },
      natureAmbient: {
        label: "Nature ambient",
      },
    },
  },
  session: {
    firstValueTitle: "Let's wind down",
    completedTitle: "Session complete",
    completedSubtitle: "You completed your breath cycles.",
  },
  notificationGate: {
    contextLabel: "Gentle reminders",
    headline: "Want one quiet reminder for your wind-down?",
    body: "We'll send one evening reminder only if you haven't opened Nidoru yet that day. No spam, no sales. Turn it off anytime.",
    oneEveningReminder: "One evening reminder",
    silentIfOpened: "Silent if you already opened Nidoru",
    noPressure: "No sales, pressure, or red badges",
    primaryCta: "Turn on evening reminder",
    secondaryCta: "Not now",
    helper: "You can change this later in Profile.",
    eveningReminderTitle: "Your wind-down is ready.",
    eveningReminderBody: "A quiet evening reminder is here when you want it.",
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
    techniques: {
      "4-7-8-sleep": {
        name: "4-7-8 Sueno",
        description: "Una cadencia para dormir y ayuda inmediata con exhalacion larga.",
        primaryContext: "Antes de dormir y Ayudame ahora",
      },
      "box-breathing": {
        name: "Respiracion en caja",
        description: "Una cadencia cuadrada para ansiedad, calma y foco.",
        primaryContext: "Ansiedad y estres",
      },
      "coherent-breathing": {
        name: "Respiracion coherente",
        description: "Una practica de 5.5 segundos para inhalar y exhalar en Daily Calm y HRV.",
        primaryContext: "Daily Calm / Entrenamiento HRV",
      },
      "diaphragmatic-breathing": {
        name: "Respiracion diafragmatica",
        description: "Una respiracion abdominal simple para aliviar el estres.",
        primaryContext: "Alivio del estres",
      },
      "physiological-sigh": {
        name: "Suspiro fisiologico",
        description: "Un reset de doble inhalacion conservado como candidato post-MVP.",
        primaryContext: "Panico o estres agudo",
      },
    },
    audioCueModes: {
      none: {
        label: "Ninguno",
      },
      gentleBell: {
        label: "Campana suave",
      },
      softWhoosh: {
        label: "Soplo suave",
      },
      natureAmbient: {
        label: "Ambiente natural",
      },
    },
  },
  session: {
    firstValueTitle: "Vamos a bajar el ritmo",
    completedTitle: "Sesion completa",
    completedSubtitle: "Completaste tus ciclos de respiracion.",
  },
  notificationGate: {
    contextLabel: "Recordatorios suaves",
    headline: "Quieres un recordatorio tranquilo para bajar el ritmo?",
    body: "Enviaremos un recordatorio por la noche solo si aun no abriste Nidoru ese dia. Sin spam ni ventas. Puedes desactivarlo cuando quieras.",
    oneEveningReminder: "Un recordatorio por la noche",
    silentIfOpened: "Silencioso si ya abriste Nidoru",
    noPressure: "Sin ventas, presion ni insignias rojas",
    primaryCta: "Activar recordatorio nocturno",
    secondaryCta: "Ahora no",
    helper: "Puedes cambiarlo despues en Perfil.",
    eveningReminderTitle: "Tu descanso esta listo.",
    eveningReminderBody: "Un recordatorio tranquilo te espera cuando quieras.",
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
    techniques: {
      "4-7-8-sleep": {
        name: "Sono 4-7-8",
        description: "Uma cadencia para dormir e ajuda imediata com expiracao longa.",
        primaryContext: "Antes de dormir e Me ajuda agora",
      },
      "box-breathing": {
        name: "Respiracao em caixa",
        description: "Uma cadencia quadrada para ansiedade, calma e foco.",
        primaryContext: "Ansiedade e estresse",
      },
      "coherent-breathing": {
        name: "Respiracao coerente",
        description: "Uma pratica de 5.5 segundos para inspirar e expirar em Daily Calm e HRV.",
        primaryContext: "Daily Calm / Treino HRV",
      },
      "diaphragmatic-breathing": {
        name: "Respiracao diafragmatica",
        description: "Uma respiracao abdominal simples para aliviar o estresse.",
        primaryContext: "Alivio do estresse",
      },
      "physiological-sigh": {
        name: "Suspiro fisiologico",
        description: "Um reset de dupla inspiracao mantido como candidato pos-MVP.",
        primaryContext: "Panico ou estresse agudo",
      },
    },
    audioCueModes: {
      none: {
        label: "Nenhum",
      },
      gentleBell: {
        label: "Sino suave",
      },
      softWhoosh: {
        label: "Sopro suave",
      },
      natureAmbient: {
        label: "Ambiente natural",
      },
    },
  },
  session: {
    firstValueTitle: "Vamos desacelerar",
    completedTitle: "Sessao completa",
    completedSubtitle: "Voce completou seus ciclos de respiracao.",
  },
  notificationGate: {
    contextLabel: "Lembretes suaves",
    headline: "Quer um lembrete tranquilo para desacelerar?",
    body: "Vamos enviar um lembrete a noite somente se voce ainda nao abriu o Nidoru naquele dia. Sem spam, sem vendas. Desative quando quiser.",
    oneEveningReminder: "Um lembrete a noite",
    silentIfOpened: "Silencioso se voce ja abriu o Nidoru",
    noPressure: "Sem vendas, pressao ou badges vermelhos",
    primaryCta: "Ativar lembrete noturno",
    secondaryCta: "Agora nao",
    helper: "Voce pode mudar isso depois em Perfil.",
    eveningReminderTitle: "Seu descanso esta pronto.",
    eveningReminderBody: "Um lembrete tranquilo espera por voce quando quiser.",
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

export function normalizeLocale(locale: string | null | undefined): Locale {
  if (locale?.toLowerCase().startsWith("es")) {
    return "es";
  }

  if (locale?.toLowerCase().startsWith("pt")) {
    return "pt-BR";
  }

  return "en";
}

export function getLocaleMessages(locale: string | null | undefined): LocaleMessages {
  return messages[normalizeLocale(locale)];
}
