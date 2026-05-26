import { describe, expect, it } from "@jest/globals";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mobileRoot = join(__dirname, "..");

const readMobileSource = (sourcePath: string) => readFileSync(join(mobileRoot, sourcePath), "utf8");
const mobileSourceExists = (sourcePath: string) => existsSync(join(mobileRoot, sourcePath));

describe("Tailwind migration guardrails", () => {
  it("keeps the reusable design-system layer free of static StyleSheet styling", () => {
    for (const sourcePath of [
      "src/design-system/index.ts",
      "src/design-system/screen.tsx",
      "src/design-system/typography.tsx",
      "src/design-system/interaction.tsx",
      "src/design-system/surface.tsx",
      "src/design-system/orb.tsx",
      "src/design-system/global-tab-bar.tsx",
    ]) {
      const source = readMobileSource(sourcePath);

      expect(source).not.toMatch(/StyleSheet\.create|styles\./);
    }
  });

  it("routes the global tab bar through the Home-derived shared primitive", () => {
    const source = readMobileSource("src/navigation/app-tab-bar.tsx");

    expect(source).toContain("GlobalTabBarSurface");
    expect(source).not.toContain("StyleSheet.create");
    expect(source).not.toContain("styles.");
  });

  it("keeps the first guided session screen migrated to Tailwind base UI styling", () => {
    const source = readMobileSource("src/session/first-session-screen.tsx");

    expect(source).toContain('from "../tw"');
    expect(source).toContain("className=");
    expect(source).not.toContain("StyleSheet.create");
    expect(source).not.toMatch(/\bstyles\./);
  });

  it("keeps notification and post-value paywall surfaces migrated to Tailwind base UI styling", () => {
    for (const sourcePath of [
      "src/notifications/notification-permission-gate-screen.tsx",
      "src/paywall/post-value-account-paywall-screen.tsx",
    ]) {
      const source = readMobileSource(sourcePath);

      expect(source).toContain('from "../tw"');
      expect(source).toContain("className=");
      expect(source).not.toContain("StyleSheet.create");
      expect(source).not.toMatch(/\bstyles\./);
    }

    const paywallRouteSource = readMobileSource("src/paywall/post-value-account-paywall-route.tsx");
    expect(paywallRouteSource).toContain('from "../design-system"');
    expect(paywallRouteSource).toContain("NidoruLoadingScreen");
    expect(paywallRouteSource).not.toContain("StyleSheet.create");
    expect(paywallRouteSource).not.toMatch(/\bstyles\./);
  });

  it("keeps onboarding closeout surfaces on Tailwind wrappers instead of legacy StyleSheet styling", () => {
    for (const sourcePath of [
      "src/breathing/breathing-orb.tsx",
      "src/onboarding/first-breath-demo-screen.tsx",
      "src/onboarding/onboarding-splash-screen.tsx",
      "src/onboarding/personalized-plan-screen.tsx",
      "src/surfaces/card-fade.tsx",
    ]) {
      const source = readMobileSource(sourcePath);

      expect(source).toContain("className=");
      expect(source).toMatch(/from "\.\.\/tw"|from "\.\.\/\.\.\/tw"/);
      expect(source).not.toMatch(/StyleSheet\.create|styles\./);
    }
  });

  it("keeps retained non-product surfaces on approved Tailwind primitives", () => {
    const observabilityProofSource = readMobileSource("src/app/observability-proof.tsx");
    const paywallRouteSource = readMobileSource("src/paywall/post-value-account-paywall-route.tsx");

    expect(mobileSourceExists("src/shell/tab-entry-screen.tsx")).toBe(false);

    expect(observabilityProofSource).toContain('from "../design-system"');
    expect(observabilityProofSource).toContain("MidnightScrollScreen");
    expect(observabilityProofSource).toContain("NidoruButton");
    expect(observabilityProofSource).not.toMatch(/StyleSheet\.create|styles\.|SafeAreaView/);
    expect(observabilityProofSource).not.toMatch(/@nidoru\/ui-tokens/);

    expect(paywallRouteSource).toContain("NidoruLoadingScreen");
    expect(paywallRouteSource).not.toContain("ActivityIndicator");
  });

  it("restricts placeholder UI to intentionally future-scoped subroutes", () => {
    const allowedPlaceholderRoutes = [
      "src/app/(tabs)/check-in.tsx",
      "src/app/(tabs)/progress/[anchor].tsx",
      "src/app/(tabs)/profile/[...anchor].tsx",
      "src/app/(tabs)/sleep/sounds.tsx",
      "src/app/(tabs)/sleep/stories.tsx",
    ];

    for (const sourcePath of allowedPlaceholderRoutes) {
      expect(readMobileSource(sourcePath)).toContain("TabPlaceholderScreen");
    }

    for (const sourcePath of [
      "src/app/(tabs)/index.tsx",
      "src/app/(tabs)/sleep.tsx",
      "src/app/(tabs)/breathe.tsx",
      "src/app/(tabs)/progress.tsx",
      "src/app/(tabs)/profile.tsx",
      "src/app/(tabs)/rescue-me.tsx",
      "src/app/(tabs)/sleep/wind-down.tsx",
      "src/app/(tabs)/breathe/[technique].tsx",
    ]) {
      expect(readMobileSource(sourcePath)).not.toContain("TabPlaceholderScreen");
    }
  });
});
