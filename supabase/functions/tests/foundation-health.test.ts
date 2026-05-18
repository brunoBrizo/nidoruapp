import functionModule from "../foundation-health/index.ts";

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

Deno.test("foundation health returns a stable non-sensitive payload", async () => {
  const response = await functionModule.fetch();
  const body = await response.json();

  assertEquals(response.status, 200, "status");
  assertEquals(response.headers.get("cache-control"), "no-store", "cache-control");
  assertEquals(body.service, "foundation-health", "service");
  assertEquals(body.status, "ok", "payload status");
});
