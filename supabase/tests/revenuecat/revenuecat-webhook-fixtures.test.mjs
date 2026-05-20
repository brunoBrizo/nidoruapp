import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const fourteenDayTrialDurationMs = 14 * 24 * 60 * 60 * 1000;

describe("RevenueCat webhook fixtures", () => {
  it("keeps future webhook fixtures shaped like RevenueCat events", async () => {
    const fixtureFiles = (await readdir(fixturesDir)).filter((file) => file.endsWith(".json"));

    assert.ok(fixtureFiles.length > 0, "expected at least one RevenueCat webhook fixture");

    for (const fixtureFile of fixtureFiles) {
      const payload = JSON.parse(await readFile(join(fixturesDir, fixtureFile), "utf8"));

      assert.equal(typeof payload.api_version, "string", `${fixtureFile} api_version`);
      assert.equal(typeof payload.event, "object", `${fixtureFile} event`);
      assert.equal(typeof payload.event.id, "string", `${fixtureFile} event.id`);
      assert.equal(typeof payload.event.type, "string", `${fixtureFile} event.type`);
      assert.equal(typeof payload.event.app_user_id, "string", `${fixtureFile} event.app_user_id`);
      assert.equal(typeof payload.event.product_id, "string", `${fixtureFile} event.product_id`);

      if (payload.event.period_type === "TRIAL") {
        assert.equal(
          payload.event.expiration_at_ms - payload.event.purchased_at_ms,
          fourteenDayTrialDurationMs,
          `${fixtureFile} trial duration`,
        );
      }
    }
  });
});
