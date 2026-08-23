import { describe, expect, it } from "vitest";
import { differenceInCalendarDays } from "date-fns";

import { calculateCropTimeline } from "@/lib/server/crop-timeline/calculator";
import { CROP_DEFINITIONS, toStageConfigs } from "@/lib/server/crop-timeline/crop-definitions";

describe("crop -> anchor mapping", () => {
  it("Cotton and Maize anchor on SOWING", () => {
    expect(CROP_DEFINITIONS.find((c) => c.name === "Cotton")!.anchorType).toBe("SOWING");
    expect(CROP_DEFINITIONS.find((c) => c.name === "Maize")!.anchorType).toBe("SOWING");
  });

  it("Ginger and Sugarcane anchor on PLANTING but use different UI labels", () => {
    const ginger = CROP_DEFINITIONS.find((c) => c.name === "Ginger")!;
    const sugarcane = CROP_DEFINITIONS.find((c) => c.name === "Sugarcane")!;
    expect(ginger.anchorType).toBe("PLANTING");
    expect(sugarcane.anchorType).toBe("PLANTING");
    expect(ginger.anchorLabel).toBe("Planting Date");
    expect(sugarcane.anchorLabel).toBe("Sett Planting Date");
    expect(ginger.anchorLabel).not.toBe(sugarcane.anchorLabel);
  });

  it("Onion anchors on TRANSPLANTING", () => {
    expect(CROP_DEFINITIONS.find((c) => c.name === "Onion")!.anchorType).toBe("TRANSPLANTING");
  });
});

describe("timeline engine is anchor-terminology-agnostic", () => {
  it("shifting anchorDate by +7 days shifts every stage, including pre-anchor ones, by exactly +7 days", () => {
    const ginger = CROP_DEFINITIONS.find((c) => c.name === "Ginger")!;
    const configs = toStageConfigs(ginger.stagesByPlantingType.none, null, "ginger");

    const base = new Date("2026-06-12");
    const shifted = new Date("2026-06-19");

    const t1 = calculateCropTimeline(
      { cropMasterId: "ginger", anchorDate: base, anchorType: "PLANTING", irrigationAvailable: true },
      configs
    );
    const t2 = calculateCropTimeline(
      { cropMasterId: "ginger", anchorDate: shifted, anchorType: "PLANTING", irrigationAvailable: true },
      configs
    );

    for (let i = 0; i < t1.stages.length; i++) {
      expect(differenceInCalendarDays(t2.stages[i].expectedStartDate, t1.stages[i].expectedStartDate)).toBe(7);
      expect(differenceInCalendarDays(t2.stages[i].expectedEndDate, t1.stages[i].expectedEndDate)).toBe(7);
    }
  });

  it("produces identical output for the same config + anchor date regardless of the declared anchorType", () => {
    const cotton = CROP_DEFINITIONS.find((c) => c.name === "Cotton")!;
    const configs = toStageConfigs(cotton.stagesByPlantingType.none, null, "cotton");
    const anchor = new Date("2026-06-20");

    const asSowing = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: anchor, anchorType: "SOWING", irrigationAvailable: true },
      configs
    );
    const asPlanting = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: anchor, anchorType: "PLANTING", irrigationAvailable: true },
      configs
    );
    const asTransplanting = calculateCropTimeline(
      { cropMasterId: "cotton", anchorDate: anchor, anchorType: "TRANSPLANTING", irrigationAvailable: true },
      configs
    );

    expect(asSowing.expectedHarvestDate.getTime()).toBe(asPlanting.expectedHarvestDate.getTime());
    expect(asSowing.expectedHarvestDate.getTime()).toBe(asTransplanting.expectedHarvestDate.getTime());
    for (let i = 0; i < asSowing.stages.length; i++) {
      expect(asSowing.stages[i].expectedStartDate.getTime()).toBe(asPlanting.stages[i].expectedStartDate.getTime());
      expect(asSowing.stages[i].expectedStartDate.getTime()).toBe(
        asTransplanting.stages[i].expectedStartDate.getTime()
      );
    }
  });
});
