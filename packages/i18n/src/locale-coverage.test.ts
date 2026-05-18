import { locales, messages } from "./index";
import type { Locale, LocaleMessages } from "./index";

const launchLocales: readonly Locale[] = locales;
const englishAppName: "Nidoru" = messages.en.common.appName;
const portuguesePrimaryAction: string = messages["pt-BR"].home.primaryActionTitle;

// @ts-expect-error Missing required keys must fail locale coverage.
const missingRequiredKeyLocale: LocaleMessages = {};

void launchLocales;
void englishAppName;
void portuguesePrimaryAction;
void missingRequiredKeyLocale;
