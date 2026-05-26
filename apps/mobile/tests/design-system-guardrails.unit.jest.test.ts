import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mobileRoot = join(__dirname, "..");

const readMobileSource = (sourcePath: string) => readFileSync(join(mobileRoot, sourcePath), "utf8");

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
});
