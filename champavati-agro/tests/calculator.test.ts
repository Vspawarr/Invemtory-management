import { describe, expect, it } from "vitest";
import { differenceInCalendarDays } from "date-fns";

import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import {
  CROP_DEFINITIONS,
  getCropDefinition,
  toStageConfigs,
} from "@/lib/server/crop-timeline/crop-definitions";

describe("calculateCropTimeline", () => {
  it("computes every crop + planting-type timeline without error", () => {
    for (const crop of CROP_DEFINITIONS) {
      for (const [plantingType, defs] of Object.entries(crop.stagesByPlantingType)) {
        const configs = toStageConfigs(
          defs,
          plantingType === "none" ? null : (plantingType as never),
          `${crop.name}-${plantingType}`
        );
        const timeline = calculateCropTimeline(
          {
            cropMasterId: crop.name,
            anchorDate: new Date("2026-06-20"),
            anchorType: crop.anchorType,
            irrigationAvailable: true,
          },
          configs
        );
        expect(timeline.stages.length).toBe(configs.length);
        expect(timeline.expectedHarvestDate.getTime()).toBeGreaterThan(
          new Date("2026-06-20").getTime()
        );
      }
    }
  });

  it("Cotton: different sowing dates shift the ENTIRE timeline by exactly the same delta, including pre-sowing stages", () => {
    const cotton = getCropDefinition("Cotton")!;
    const configs = toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton");

    const dateA = new Date("2026-06-18");
    const dateB = new Date("2026-06-25"); // 7 days later

    const timelineA = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: dateA, anchorType: "SOWING", irrigationAvailable: true },
      configs
    );
    const timelineB = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: dateB, anchorType: "SOWING", irrigationAvailable: true },
      configs
    );

    for (let i = 0; i < timelineA.stages.length; i++) {
      const deltaStart = differenceInCalendarDays(
        timelineB.stages[i].expectedStartDate,
        timelineA.stages[i].expectedStartDate
      );
      const deltaEnd = differenceInCalendarDays(
        timelineB.stages[i].expectedEndDate,
        timelineA.stages[i].expectedEndDate
      );
      expect(deltaStart).toBe(7);
      expect(deltaEnd).toBe(7);
    }

    // Land Preparation (pre-sowing, negative offset) must be BEFORE the sowing date in both cases.
    const landPrepA = timelineA.stages.find((s) => s.name === "Land Preparation")!;
    const sowingA = timelineA.stages.find((s) => s.name === "Sowing")!;
    expect(landPrepA.expectedEndDate.getTime()).toBeLessThanOrEqual(sowingA.expectedStartDate.getTime());
  });

  it("pre-anchor stages resolve to dates before the anchor date for every crop that has one", () => {
    const anchor = new Date("2026-06-20");

    const ginger = getCropDefinition("Ginger")!;
    const gingerTimeline = calculateCropTimeline(
      { cropMasterId: "ginger", anchorDate: anchor, anchorType: "PLANTING", irrigationAvailable: true },
      toStageConfigs(ginger.stagesByPlantingType.none, null, "ginger")
    );
    const rhizomeTreatment = gingerTimeline.stages.find((s) => s.name === "Seed Rhizome Treatment")!;
    expect(rhizomeTreatment.expectedStartDate.getTime()).toBeLessThan(anchor.getTime());

    const onion = getCropDefinition("Onion")!;
    const onionTimeline = calculateCropTimeline(
      {
        cropMasterId: "onion",
        anchorDate: anchor,
        anchorType: "TRANSPLANTING",
        plantingType: "RABI",
        irrigationAvailable: true,
      },
      toStageConfigs(onion.stagesByPlantingType.RABI, "RABI", "onion-rabi")
    );
    const nursery = onionTimeline.stages.find((s) => s.name === "Nursery Preparation")!;
    const seedling = onionTimeline.stages.find((s) => s.name === "Seedling Development")!;
    expect(nursery.expectedStartDate.getTime()).toBeLessThan(anchor.getTime());
    expect(seedling.expectedEndDate.getTime()).toBeLessThanOrEqual(anchor.getTime());

    const sugarcane = getCropDefinition("Sugarcane")!;
    const scTimeline = calculateCropTimeline(
      {
        cropMasterId: "sugarcane",
        anchorDate: anchor,
        anchorType: "PLANTING",
        plantingType: "ADSALI",
        irrigationAvailable: true,
      },
      toStageConfigs(sugarcane.stagesByPlantingType.ADSALI, "ADSALI", "sc-adsali")
    );
    const landPrep = scTimeline.stages.find((s) => s.name === "Land Preparation")!;
    expect(landPrep.expectedStartDate.getTime()).toBeLessThan(anchor.getTime());

    const cotton = getCropDefinition("Cotton")!;
    const cottonTimeline = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: anchor, anchorType: "SOWING", irrigationAvailable: true },
      toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton")
    );
    const cottonLandPrep = cottonTimeline.stages.find((s) => s.name === "Land Preparation")!;
    expect(cottonLandPrep.expectedStartDate.getTime()).toBeLessThan(anchor.getTime());
  });

  it("Onion RABI and KHARIF use different stage configs and produce different harvest dates for the same anchor date", () => {
    const onion = getCropDefinition("Onion")!;
    const anchor = new Date("2026-10-15");

    const rabi = calculateCropTimeline(
      { cropMasterId: "onion", anchorDate: anchor, anchorType: "TRANSPLANTING", plantingType: "RABI", irrigationAvailable: true },
      toStageConfigs(onion.stagesByPlantingType.RABI, "RABI", "onion-rabi")
    );
    const kharif = calculateCropTimeline(
      { cropMasterId: "onion", anchorDate: anchor, anchorType: "TRANSPLANTING", plantingType: "KHARIF", irrigationAvailable: true },
      toStageConfigs(onion.stagesByPlantingType.KHARIF, "KHARIF", "onion-kharif")
    );

    expect(rabi.expectedHarvestDate.getTime()).not.toBe(kharif.expectedHarvestDate.getTime());
  });

  it("Sugarcane 15 Jul as ADSALI produces a materially longer cycle than 15 Jan as SURU", () => {
    const sugarcane = getCropDefinition("Sugarcane")!;

    const adsali = calculateCropTimeline(
      {
        cropMasterId: "sugarcane",
        anchorDate: new Date("2026-07-15"),
        anchorType: "PLANTING",
        plantingType: "ADSALI",
        irrigationAvailable: true,
      },
      toStageConfigs(sugarcane.stagesByPlantingType.ADSALI, "ADSALI", "sc-adsali")
    );
    const suru = calculateCropTimeline(
      {
        cropMasterId: "sugarcane",
        anchorDate: new Date("2026-01-15"),
        anchorType: "PLANTING",
        plantingType: "SURU",
        irrigationAvailable: true,
      },
      toStageConfigs(sugarcane.stagesByPlantingType.SURU, "SURU", "sc-suru")
    );

    const adsaliCycleDays = differenceInCalendarDays(
      adsali.expectedHarvestDate,
      new Date("2026-07-15")
    );
    const suruCycleDays = differenceInCalendarDays(suru.expectedHarvestDate, new Date("2026-01-15"));

    expect(adsaliCycleDays).toBeGreaterThan(suruCycleDays);
  });

  it("expected harvest date computation matches the final stage's expected end date", () => {
    const maize = getCropDefinition("Maize")!;
    const configs = toStageConfigs(maize.stagesByPlantingType.none, null, "maize");
    const timeline = calculateCropTimeline(
      { cropMasterId: "maize", anchorDate: new Date("2026-06-28"), anchorType: "SOWING", irrigationAvailable: true },
      configs
    );
    const lastStage = timeline.stages[timeline.stages.length - 1];
    expect(timeline.expectedHarvestDate.getTime()).toBe(lastStage.expectedEndDate.getTime());
  });

  it("negative, zero, and positive offsets all resolve to correct calendar dates", () => {
    const cotton = getCropDefinition("Cotton")!;
    const configs = toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton");
    const anchor = new Date("2026-06-20");
    const timeline = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: anchor, anchorType: "SOWING", irrigationAvailable: true },
      configs
    );

    const landPrep = timeline.stages.find((st) => st.name === "Land Preparation")!; // negative
    const sowing = timeline.stages.find((st) => st.name === "Sowing")!; // zero
    const emergence = timeline.stages.find((st) => st.name === "Emergence")!; // positive

    expect(differenceInCalendarDays(landPrep.expectedStartDate, anchor)).toBe(-20);
    expect(differenceInCalendarDays(sowing.expectedStartDate, anchor)).toBe(0);
    expect(differenceInCalendarDays(emergence.expectedStartDate, anchor)).toBe(5);
  });

  it("throws TimelineConfigError instead of silently producing an overlapping timeline for an inconsistent config", () => {
    const cotton = getCropDefinition("Cotton")!;
    const configs = toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton");
    configs[0].defaultEndOffsetDays = 50; // Land Prep now overlaps several later stages
    expect(() =>
      calculateCropTimeline(
        { cropMasterId: "cotton", anchorDate: new Date("2026-06-20"), anchorType: "SOWING", irrigationAvailable: true },
        configs
      )
    ).toThrow(/inconsistent/i);
  });
});
