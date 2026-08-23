import { describe, expect, it } from "vitest";

import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import { buildTimelineStageSnapshots } from "@/lib/server/crop-timeline/snapshot";
import { getCropDefinition, toStageConfigs } from "@/lib/server/crop-timeline/crop-definitions";

describe("buildTimelineStageSnapshots", () => {
  const maize = getCropDefinition("Maize")!;
  const configs = toStageConfigs(maize.stagesByPlantingType.none, null, "maize");
  const anchor = new Date("2026-06-28");
  const timeline = calculateCropTimeline(
    { cropMasterId: "maize", anchorDate: anchor, anchorType: "SOWING", irrigationAvailable: true },
    configs
  );

  it("produces one snapshot row per calculated stage, carrying the offsets forward", () => {
    const snapshots = buildTimelineStageSnapshots(timeline, new Date("2026-06-20"));
    expect(snapshots.length).toBe(timeline.stages.length);
    snapshots.forEach((snap, i) => {
      expect(snap.startOffsetDaysSnapshot).toBe(timeline.stages[i].startOffsetDays);
      expect(snap.endOffsetDaysSnapshot).toBe(timeline.stages[i].endOffsetDays);
      expect(snap.stageNameSnapshot).toBe(timeline.stages[i].name);
      expect(snap.sequenceSnapshot).toBe(timeline.stages[i].sequence);
    });
  });

  it("computes an initial status per stage relative to `today` (before sowing = everything UPCOMING except pre-anchor stages already elapsed)", () => {
    const snapshots = buildTimelineStageSnapshots(timeline, new Date("2026-05-01"));
    const landPrep = snapshots.find((s) => s.stageNameSnapshot === "Land Preparation")!;
    const harvest = snapshots.find((s) => s.stageNameSnapshot === "Harvest")!;
    expect(landPrep.status).toBe("UPCOMING");
    expect(harvest.status).toBe("UPCOMING");
  });

  it("marks a stage CURRENT when `today` falls inside its expected window", () => {
    const snapshots = buildTimelineStageSnapshots(timeline, anchor);
    const sowing = snapshots.find((s) => s.stageNameSnapshot === "Sowing")!;
    expect(sowing.status).toBe("CURRENT");
  });

  it("carries forward critical/water/weather-sensitivity flags and monitoring text unchanged", () => {
    const snapshots = buildTimelineStageSnapshots(timeline);
    const tasseling = snapshots.find((s) => s.stageNameSnapshot === "Tasseling/Silking")!;
    expect(tasseling.criticalStageSnapshot).toBe(true);
    expect(tasseling.waterSensitiveSnapshot).toBe(true);
    expect(tasseling.monitoringActionsSnapshot).toMatch(/water-sensitive/i);
  });
});
