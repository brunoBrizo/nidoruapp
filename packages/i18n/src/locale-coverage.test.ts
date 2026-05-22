import { getLocaleMessages, locales, messages, normalizeLocale } from "./index";
import type { Locale, LocaleMessages } from "./index";

const launchLocales: readonly Locale[] = locales;
const englishAppName: "Nidoru" = messages.en.common.appName;
const englishDiaphragmaticName: string =
  messages.en.breath.techniques["diaphragmatic-breathing"].name;
const englishNatureAmbientMode: string = messages.en.breath.audioCueModes.natureAmbient.label;
const portuguesePrimaryAction: string = messages["pt-BR"].home.primaryActionTitle;
const portugueseBreathPhase: string = messages["pt-BR"].breath.phaseSecondInhale;
const spanishNotificationGate: string = messages.es.notificationGate.primaryCta;
const spanishSoftWhooshMode: string = messages.es.breath.audioCueModes.softWhoosh.label;

// @ts-expect-error Missing required keys must fail locale coverage.
const missingRequiredKeyLocale: LocaleMessages = {};

void launchLocales;
void englishAppName;
void englishDiaphragmaticName;
void englishNatureAmbientMode;
void portuguesePrimaryAction;
void portugueseBreathPhase;
void spanishNotificationGate;
void spanishSoftWhooshMode;
void missingRequiredKeyLocale;

if (normalizeLocale("pt-BR") !== "pt-BR") {
  throw new Error("Portuguese locale normalization must preserve pt-BR launch copy.");
}

if (getLocaleMessages("es-MX").notificationGate.secondaryCta !== "Ahora no") {
  throw new Error("Spanish regional locales must use Spanish notification gate copy.");
}
