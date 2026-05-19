import { breathTechniques } from "@nidoru/domain";
import { locales, messages } from "@nidoru/i18n";
import { colors } from "@nidoru/ui-tokens";
import { localInstallIdSchema } from "@nidoru/validation";

export type RouteShellId = "marketing" | "legal" | "support" | "admin";

export type RouteShell = {
  readonly id: RouteShellId;
  readonly path: string;
  readonly navLabel: string;
  readonly label: string;
  readonly title: string;
  readonly summary: string;
  readonly cardTitle: string;
  readonly cardText: string;
};

const marketingShell = {
  id: "marketing",
  path: "/",
  navLabel: "Marketing",
  label: "Public web",
  title: "Sleep sounds and breathwork",
  summary:
    "The launch home for Nidoru will introduce the nighttime ritual without adding product flows yet.",
  cardTitle: "Foundation scope",
  cardText:
    "This shell keeps the public route in place while future marketing copy, assets, and conversion paths are designed.",
} as const satisfies RouteShell;

const legalShell = {
  id: "legal",
  path: "/legal",
  navLabel: "Legal",
  label: "Legal web",
  title: "Legal center",
  summary: "Policy, privacy, and terms pages will live here before public launch.",
  cardTitle: "Foundation scope",
  cardText:
    "This shell reserves the legal surface without final policy text or jurisdiction-specific language.",
} as const satisfies RouteShell;

const supportShell = {
  id: "support",
  path: "/support",
  navLabel: "Support",
  label: "Support web",
  title: "Support center",
  summary: "Help, contact, and support routing will start here once launch operations are ready.",
  cardTitle: "Foundation scope",
  cardText:
    "This shell avoids support automation until the support workflow and provider setup are chosen.",
} as const satisfies RouteShell;

const adminShell = {
  id: "admin",
  path: "/admin",
  navLabel: "Admin",
  label: "Admin web",
  title: "Admin shell",
  summary:
    "Internal operations and content workflows will start here after authentication and admin requirements are scoped.",
  cardTitle: "Foundation scope",
  cardText:
    "This shell reserves the route without building real admin workflows, data access, or privileged actions.",
} as const satisfies RouteShell;

export const routeShells = [
  marketingShell,
  legalShell,
  supportShell,
  adminShell,
] as const satisfies readonly RouteShell[];

export const routeShellById = {
  marketing: marketingShell,
  legal: legalShell,
  support: supportShell,
  admin: adminShell,
} as const satisfies Record<RouteShellId, RouteShell>;

export const sharedWebFoundation = {
  appName: messages.en.common.appName,
  localeCount: locales.length,
  backgroundColor: colors.dark.background.value,
  proofTechniqueName: breathTechniques["4-7-8-sleep"].name,
  acceptsLocalInstallId: localInstallIdSchema.safeParse("install_web_foundation").success,
} as const;
