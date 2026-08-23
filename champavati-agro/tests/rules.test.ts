import { describe, expect, it } from "vitest";

import { determineStageStatus, guessInitialCurrentStage } from "@/lib/server/crop-timeline/rules";

describe("determineStageStatus", () => {
  const expectedStartDate = new Date("2026-06-01");
  const expectedEndDate = new Date("2026-06-10");

  it("is UPCOMING before the expected start", () => {
    const status = determineStageStatus({ expectedStartDate, expectedEndDate }, new Date("2026-05-20"));
    expect(status).toBe("UPCOMING");
  });

  it("is CURRENT within the expected window with no actual dates recorded", () => {
    const status = determineStageStatus({ expectedStartDate, expectedEndDate }, new Date("2026-06-05"));
    expect(status).toBe("CURRENT");
  });

  it("is DELAYED once past the expected end with no actual end recorded — never FAILED", () => {
    const status = determineStageStatus({ expectedStartDate, expectedEndDate }, new Date("2026-06-25"));
    expect(status).toBe("DELAYED");
    expect(status).not.toBe("FAILED" as never);
  });

  it("is COMPLETED once an actual end date is recorded, even if it was later than expected", () => {
    const status = determineStageStatus(
      { expectedStartDate, expectedEndDate, actualStartDate: new Date("2026-06-02"), actualEndDate: new Date("2026-06-18") },
      new Date("2026-07-01")
    );
    expect(status).toBe("COMPLETED");
  });

  it("is CURRENT (not delayed) if actualStartDate is recorded and still within the grace window", () => {
    const status = determineStageStatus(
      { expectedStartDate, expectedEndDate, actualStartDate: new Date("2026-06-02") },
      new Date("2026-06-09")
    );
    expect(status).toBe("CURRENT");
  });

  it("is DELAYED if started but running past the expected end without finishing", () => {
    const status = determineStageStatus(
      { expectedStartDate, expectedEndDate, actualStartDate: new Date("2026-06-02") },
      new Date("2026-06-20")
    );
    expect(status).toBe("DELAYED");
  });
});

describe("guessInitialCurrentStage", () => {
  it("picks the last stage whose expected window has already begun by today", () => {
    const stages = [
      { sequence: 1, expectedStartDate: new Date("2026-01-01") },
      { sequence: 2, expectedStartDate: new Date("2026-01-06") },
      { sequence: 3, expectedStartDate: new Date("2026-01-11") },
    ];
    expect(guessInitialCurrentStage(stages, new Date("2026-01-07"))?.sequence).toBe(2);
  });

  it("falls back to the first stage if the anchor date is entirely in the future", () => {
    const stages = [
      { sequence: 1, expectedStartDate: new Date("2026-01-01") },
      { sequence: 2, expectedStartDate: new Date("2026-01-06") },
    ];
    expect(guessInitialCurrentStage(stages, new Date("2025-12-01"))?.sequence).toBe(1);
  });

  it("picks the final stage once every stage's window has begun", () => {
    const stages = [
      { sequence: 1, expectedStartDate: new Date("2026-01-01") },
      { sequence: 2, expectedStartDate: new Date("2026-01-06") },
    ];
    expect(guessInitialCurrentStage(stages, new Date("2026-06-01"))?.sequence).toBe(2);
  });
});
