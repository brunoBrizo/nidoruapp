import { describe, expect, it } from "@jest/globals";

import { cn } from "../src/tw";

describe("Tailwind class merge helper", () => {
  it("keeps conditional classes while resolving utility conflicts", () => {
    expect(cn("px-4 text-nidoru-dark-text-secondary", false, "px-6", null, undefined)).toBe(
      "text-nidoru-dark-text-secondary px-6",
    );
  });
});
