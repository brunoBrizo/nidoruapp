import { breathTechniques } from "@nidoru/domain";
import { locales, messages } from "@nidoru/i18n";
import { colors } from "@nidoru/ui-tokens";
import { localInstallIdSchema } from "@nidoru/validation";

export const sharedPackageProof = {
  appName: messages.en.common.appName,
  backgroundColor: colors.dark.background.value,
  localeCount: locales.length,
  rescueTechniqueId: breathTechniques["4-7-8-sleep"].id,
  acceptsLocalInstallId: localInstallIdSchema.safeParse("install_0123456789abcdef").success,
} as const;
