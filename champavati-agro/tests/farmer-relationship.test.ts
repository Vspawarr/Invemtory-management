import { describe, expect, it } from "vitest";

import { formatRelationshipDuration } from "@/lib/server/farmer-relationship";

describe("formatRelationshipDuration", () => {
  it("registered today reads as 'New today'", () => {
    const today = new Date("2026-08-23");
    expect(formatRelationshipDuration(today, today)).toBe("New today");
  });

  it("under a month shows days", () => {
    expect(formatRelationshipDuration(new Date("2026-08-01"), new Date("2026-08-23"))).toBe("22 days");
  });

  it("exactly one day shows singular 'day'", () => {
    expect(formatRelationshipDuration(new Date("2026-08-22"), new Date("2026-08-23"))).toBe("1 day");
  });

  it("under two years shows months", () => {
    expect(formatRelationshipDuration(new Date("2025-10-23"), new Date("2026-08-23"))).toBe("10 months");
  });

  it("exactly one month shows singular 'month'", () => {
    expect(formatRelationshipDuration(new Date("2026-07-23"), new Date("2026-08-23"))).toBe("1 month");
  });

  it("two or more years shows years + remainder months", () => {
    expect(formatRelationshipDuration(new Date("2024-05-23"), new Date("2026-08-23"))).toBe("2y 3m");
  });

  it("an exact whole-year anniversary shows years with no remainder", () => {
    expect(formatRelationshipDuration(new Date("2024-08-23"), new Date("2026-08-23"))).toBe("2 years");
  });

  it("exactly one whole year (no remainder) uses singular 'year'", () => {
    expect(formatRelationshipDuration(new Date("2023-08-23"), new Date("2026-08-23"))).toBe("3 years");
  });

  it("never reports a negative duration for a registration date in the future", () => {
    expect(formatRelationshipDuration(new Date("2026-09-01"), new Date("2026-08-23"))).toBe("New today");
  });
});
