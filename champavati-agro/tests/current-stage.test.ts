import { describe, expect, it } from "vitest";
import { addDays } from "date-fns";

import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import {
  computeCropStageStatuses,
  guessInitialCurrentStage,
  isStatusConcerning,
  getCropStageDisplay,
} from "@/lib/server/crop-timeline/rules";
import { getCropDefinition, toStageConfigs } from "@/lib/server/crop-timeline/crop-definitions";

const cotton = getCropDefinition("Cotton")!;
const configs = toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton");

function cottonTimeline(anchorDate: Date) {
  return calculateCropTimeline(
    { cropMasterId: "cotton", anchorDate, anchorType: "SOWING", irrigationAvailable: true },
    configs
  );
}

describe("computeCropStageStatuses — progression-aware", () => {
  const anchor = new Date("2026-06-18");
  const today = new Date("2026-08-23"); // 66 days after sowing
  const timeline = cottonTimeline(anchor);
  const stagesInput = timeline.stages.map((s) => ({
    sequence: s.sequence,
    name: s.name,
    expectedStartDate: s.expectedStartDate,
    expectedEndDate: s.expectedEndDate,
    actualStartDate: null as Date | null,
    actualEndDate: null as Date | null,
  }));

  it("with no currentStageSequence set (fresh crop), falls back to pure calendar evidence", () => {
    const statuses = computeCropStageStatuses(stagesInput, null, today);
    // Every stage whose window has passed with no actual date is NEEDS_REVIEW,
    // not a blanket DELAYED — nothing here claims false certainty.
    const landPrep = statuses.find((s) => s.name === "Land Preparation")!;
    expect(landPrep.status).toBe("NEEDS_REVIEW");
  });

  it("once the admin confirms the crop reached Vegetative Growth, earlier stages read as COMPLETED, not delayed", () => {
    const vegetativeGrowth = stagesInput.find((s) => s.name === "Vegetative Growth")!;
    const statuses = computeCropStageStatuses(stagesInput, vegetativeGrowth.sequence, today);

    const landPrep = statuses.find((s) => s.name === "Land Preparation")!;
    const sowing = statuses.find((s) => s.name === "Sowing")!;
    const emergence = statuses.find((s) => s.name === "Emergence")!;
    const veg = statuses.find((s) => s.name === "Vegetative Growth")!;
    const squareFormation = statuses.find((s) => s.name === "Square Formation")!;

    expect(landPrep.status).toBe("COMPLETED");
    expect(sowing.status).toBe("COMPLETED");
    expect(emergence.status).toBe("COMPLETED");
    // The admin's confirmation that the crop is AT Vegetative Growth is
    // trusted outright — it is shown as CURRENT even though that stage's
    // own original expected window (13-45 days) has since elapsed by day
    // 66. Confirmed progression outranks a passive calendar guess.
    expect(veg.status).toBe("CURRENT");
    expect(squareFormation.status).toBe("UPCOMING");

    // Not one of them should show as DELAYED merely because their expected
    // window is in the past — that was the bug being regression-tested.
    for (const s of statuses) {
      if (s.sequence <= veg.sequence) {
        expect(s.status).not.toBe("DELAYED");
      }
    }
  });

  it("a stage confirmed started but genuinely overrunning is DELAYED (real evidence, not a calendar guess)", () => {
    const flowering = stagesInput.find((s) => s.name === "Flowering")!;
    const withActualStart = stagesInput.map((s) =>
      s.sequence === flowering.sequence ? { ...s, actualStartDate: new Date("2026-08-15") } : s
    );
    const statuses = computeCropStageStatuses(withActualStart, flowering.sequence, new Date("2026-12-01"));
    const floweringStatus = statuses.find((s) => s.sequence === flowering.sequence)!;
    expect(floweringStatus.status).toBe("DELAYED");
  });

  it("a confirmed current stage left untouched far past its own window (30+ days) becomes NEEDS_REVIEW — a confirmation isn't trusted forever", () => {
    const maize = getCropDefinition("Maize")!;
    const maizeConfigs = toStageConfigs(maize.stagesByPlantingType.none, null, "maize-stale");
    const timeline = calculateCropTimeline(
      { cropMasterId: "maize", anchorDate: new Date("2026-05-01"), anchorType: "SOWING", irrigationAvailable: true },
      maizeConfigs
    );
    const input = timeline.stages.map((s) => ({
      sequence: s.sequence,
      expectedStartDate: s.expectedStartDate,
      expectedEndDate: s.expectedEndDate,
      actualStartDate: null as Date | null,
      actualEndDate: null as Date | null,
    }));
    const sowing = input.find((s) => s.sequence === 2)!; // Sowing stage, single-day window
    // 114 days after sowing, with the current stage still stuck at Sowing.
    const statuses = computeCropStageStatuses(input, sowing.sequence, new Date("2026-08-23"));
    const sowingStatus = statuses.find((s) => s.sequence === sowing.sequence)!;
    expect(sowingStatus.status).toBe("NEEDS_REVIEW");
  });

  it("a confirmed current stage within the staleness window still reads as CURRENT (the earlier Vegetative Growth case, ~21 days past its own window)", () => {
    const vegetativeGrowth = stagesInput.find((s) => s.name === "Vegetative Growth")!;
    const statuses = computeCropStageStatuses(stagesInput, vegetativeGrowth.sequence, today);
    const status = statuses.find((s) => s.sequence === vegetativeGrowth.sequence)!;
    expect(status.status).toBe("CURRENT");
  });

  it("isStatusConcerning flags both DELAYED and NEEDS_REVIEW for the dashboard's Delayed Crops KPI", () => {
    expect(isStatusConcerning("DELAYED")).toBe(true);
    expect(isStatusConcerning("NEEDS_REVIEW")).toBe(true);
    expect(isStatusConcerning("CURRENT")).toBe(false);
    expect(isStatusConcerning("COMPLETED")).toBe(false);
    expect(isStatusConcerning("UPCOMING")).toBe(false);
  });

  it("a freshly created crop (real app flow: creation guesses an initial current stage from the calendar) is never flagged as delayed on day one", () => {
    // This mirrors what createCropAction actually does: guessInitialCurrentStage
    // picks a calendar-plausible starting stage, then computeCropStageStatuses
    // uses that as progression evidence — never leaving a brand-new crop's
    // stages sitting at NEEDS_REVIEW/DELAYED on the day it was created.
    const freshAnchor = new Date();
    const freshTimeline = cottonTimeline(freshAnchor);
    const freshInput = freshTimeline.stages.map((s) => ({
      sequence: s.sequence,
      expectedStartDate: s.expectedStartDate,
      expectedEndDate: s.expectedEndDate,
      actualStartDate: null as Date | null,
      actualEndDate: null as Date | null,
    }));
    const guessed = guessInitialCurrentStage(freshInput, freshAnchor);
    const statuses = computeCropStageStatuses(freshInput, guessed?.sequence ?? null, freshAnchor);
    expect(statuses.some((s) => isStatusConcerning(s.status))).toBe(false);
  });
});

describe("getCropStageDisplay — reconciles confirmed vs. expected stage (CRITICAL QA regression)", () => {
  const maize = getCropDefinition("Maize")!;
  const maizeConfigs = toStageConfigs(maize.stagesByPlantingType.none, null, "maize-display");

  function maizeInput(anchorDate: Date) {
    const timeline = calculateCropTimeline(
      { cropMasterId: "maize", anchorDate, anchorType: "SOWING", irrigationAvailable: true },
      maizeConfigs
    );
    return timeline.stages.map((s) => ({
      sequence: s.sequence,
      name: s.name,
      expectedStartDate: s.expectedStartDate,
      expectedEndDate: s.expectedEndDate,
      actualStartDate: null as Date | null,
      actualEndDate: null as Date | null,
    }));
  }

  // The exact scenario from the QA screenshot: Maize sown 1 May 2026, today
  // 23 Aug 2026 (114 days in) — the calendar has long since reached Harvest,
  // but the crop's confirmed current stage was never advanced past Sowing.
  const anchor = new Date("2026-05-01");
  const today = new Date("2026-08-23");
  const input = maizeInput(anchor);
  const sowing = input.find((s) => s.name === "Sowing")!;
  const harvest = input.find((s) => s.name === "Harvest")!;
  const grainFilling = input.find((s) => s.name === "Grain Filling")!;
  const landPrep = input.find((s) => s.name === "Land Preparation")!;

  it("A — a confirmed stage stuck at Sowing 114 days in must not be presented as Current Stage: the display falls back to the calendar-expected stage (Harvest) with needsReview true, never a bare 'Sowing'", () => {
    const display = getCropStageDisplay(input, sowing.sequence, today);
    expect(display.needsReview).toBe(true);
    expect(display.confirmedStatus).toBe("NEEDS_REVIEW");
    expect(display.expectedSequence).toBe(harvest.sequence);
  });

  it("B — admin confirms Current Stage = Harvest: trusted directly, no needs-review flag", () => {
    const display = getCropStageDisplay(input, harvest.sequence, today);
    expect(display.confirmedSequence).toBe(harvest.sequence);
    expect(display.confirmedStatus).toBe("CURRENT");
    expect(display.needsReview).toBe(false);
  });

  it("C — admin confirms an earlier stage (Grain Filling): trusted as-is, not overridden by the later calendar-expected stage", () => {
    const display = getCropStageDisplay(input, grainFilling.sequence, today);
    expect(display.confirmedSequence).toBe(grainFilling.sequence);
    expect(display.confirmedStatus).toBe("CURRENT");
    expect(display.needsReview).toBe(false);
  });

  it("E — no confirmation has ever been recorded (currentStageSequence null): needsReview is true and the expected stage still resolves purely from the calendar", () => {
    const display = getCropStageDisplay(input, null, today);
    expect(display.confirmedSequence).toBeNull();
    expect(display.confirmedStatus).toBeNull();
    expect(display.needsReview).toBe(true);
    expect(display.expectedSequence).toBe(harvest.sequence);
  });

  it("F — a stage the crop has already progressed past is COMPLETED, never flagged delayed merely because its own expected window is long past", () => {
    const statuses = computeCropStageStatuses(input, harvest.sequence, today);
    expect(statuses.find((s) => s.sequence === landPrep.sequence)!.status).toBe("COMPLETED");
  });

  it("G — Crop.status display and the timeline's own per-stage status can never contradict: getCropStageDisplay reuses computeCropStageStatuses rather than recalculating separately", () => {
    const display = getCropStageDisplay(input, sowing.sequence, today);
    const timelineStatus = computeCropStageStatuses(input, sowing.sequence, today).find(
      (s) => s.sequence === sowing.sequence
    )!.status;
    expect(display.confirmedStatus).toBe(timelineStatus);
  });
});

describe("expected harvest date — explicit Cotton scenario", () => {
  it("18 Jun 2026 sowing produces the configured Cotton final-stage end offset (harvest), not a hard-coded date", () => {
    const anchor = new Date("2026-06-18");
    const timeline = cottonTimeline(anchor);
    const finalStageDef = cotton.stagesByPlantingType.none[cotton.stagesByPlantingType.none.length - 1];
    expect(finalStageDef.name).toBe("Harvest/Pickings");

    // expectedHarvestDate must equal anchorDate + the configured final-stage
    // defaultEndOffsetDays — derived, never hard-coded.
    const expected = addDays(anchor, finalStageDef.defaultEndOffsetDays);
    expect(timeline.expectedHarvestDate.toDateString()).toBe(expected.toDateString());
    // Confirms this resolves to the same date the live UI displayed (4 Jan 2027).
    expect(timeline.expectedHarvestDate.toISOString().slice(0, 10)).toBe("2027-01-04");
  });
});
