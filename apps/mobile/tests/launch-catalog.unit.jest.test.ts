import { describe, expect, it } from "@jest/globals";
import { breathTechniques, launchSoundIds } from "@nidoru/domain";

describe("launch catalog", () => {
  it("keeps the first sleep technique and launch sounds available", () => {
    expect(breathTechniques["4-7-8-sleep"].phases).toHaveLength(3);
    expect(launchSoundIds).toContain("light-rain");
  });
});
