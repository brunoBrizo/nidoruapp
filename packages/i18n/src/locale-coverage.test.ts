import { getLocaleMessages, locales, messages, normalizeLocale } from "./index";
import type { Locale, LocaleMessages } from "./index";

const launchLocales: readonly Locale[] = locales;
const englishAppName: "Nidoru" = messages.en.common.appName;
const portuguesePrimaryAction: string = messages["pt-BR"].home.primaryActionTitle;
const spanishNotificationGate: string = messages.es.notificationGate.primaryCta;

// @ts-expect-error Missing required keys must fail locale coverage.
const missingRequiredKeyLocale: LocaleMessages = {};

void launchLocales;
void englishAppName;
void portuguesePrimaryAction;
void spanishNotificationGate;
void missingRequiredKeyLocale;

if (normalizeLocale("pt-BR") !== "pt-BR") {
  throw new Error("Portuguese locale normalization must preserve pt-BR launch copy.");
}

if (getLocaleMessages("es-MX").notificationGate.secondaryCta !== "Ahora no") {
  throw new Error("Spanish regional locales must use Spanish notification gate copy.");
}
