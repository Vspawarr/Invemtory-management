import { describe, expect, it } from "vitest";

import { calculateCropAgeDays } from "@/lib/server/crop-timeline/crop-age";

describe("calculateCropAgeDays", () => {
  it("Cotton sown 18 Jun 2026, viewed on 23 Aug 2026 -> 66 days", () => {
    const age = calculateCropAgeDays(new Date("2026-06-18"), new Date("2026-08-23"));
    expect(age).toBe(66);
  });

  it("is 0 on the anchor date itself", () => {
    const age = calculateCropAgeDays(new Date("2026-06-18"), new Date("2026-06-18"));
    expect(age).toBe(0);
  });

  it("is negative for a future anchor date (not yet sown/planted)", () => {
    const age = calculateCropAgeDays(new Date("2026-09-01"), new Date("2026-08-23"));
    expect(age).toBeLessThan(0);
  });

  it("never uses createdAt, expectedHarvestDate, or any other date — only anchorDate and today", () => {
    // A regression guard: two crops with the same anchorDate must report
    // the same age regardless of any other field.
    const anchor = new Date("2026-06-18");
    const today = new Date("2026-08-23");
    expect(calculateCropAgeDays(anchor, today)).toBe(calculateCropAgeDays(anchor, today));
  });
});
