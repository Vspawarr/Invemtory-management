import { describe, expect, it } from "vitest";

import { validateStageConfig } from "@/lib/server/crop-timeline/validate-config";
import { CROP_DEFINITIONS, toStageConfigs } from "@/lib/server/crop-timeline/crop-definitions";
import type { StageConfig } from "@/lib/server/crop-timeline/types";

function baseStages(): StageConfig[] {
  return [
    {
      id: "1",
      name: "Land Preparation",
      localName: "x",
      plantingType: null,
      sequence: 1,
      minStartOffsetDays: -20,
      defaultStartOffsetDays: -15,
      maxStartOffsetDays: -5,
      minEndOffsetDays: -10,
      defaultEndOffsetDays: -1,
      maxEndOffsetDays: 3,
      criticalStage: false,
      waterSensitive: false,
      weatherSensitive: false,
      monitoringActions: null,
      commonPests: [],
      commonDiseases: [],
    },
    {
      id: "2",
      name: "Sowing",
      localName: "x",
      plantingType: null,
      sequence: 2,
      minStartOffsetDays: 0,
      defaultStartOffsetDays: 0,
      maxStartOffsetDays: 0,
      minEndOffsetDays: 0,
      defaultEndOffsetDays: 0,
      maxEndOffsetDays: 0,
      criticalStage: true,
      waterSensitive: false,
      weatherSensitive: false,
      monitoringActions: null,
      commonPests: [],
      commonDiseases: [],
    },
    {
      id: "3",
      name: "Emergence",
      localName: "x",
      plantingType: null,
      sequence: 3,
      minStartOffsetDays: 3,
      defaultStartOffsetDays: 5,
      maxStartOffsetDays: 9,
      minEndOffsetDays: 8,
      defaultEndOffsetDays: 12,
      maxEndOffsetDays: 16,
      criticalStage: false,
      waterSensitive: true,
      weatherSensitive: false,
      monitoringActions: null,
      commonPests: [],
      commonDiseases: [],
    },
  ];
}

describe("validateStageConfig", () => {
  it("accepts a valid configuration with negative, zero, and positive offsets", () => {
    const result = validateStageConfig(baseStages());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects overlapping stages (a negative-offset stage overlapping the anchor)", () => {
    const stages = baseStages();
    stages[0].defaultEndOffsetDays = 5; // Land Prep now ends after Sowing starts (0)
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STAGE_OVERLAP")).toBe(true);
  });

  it("rejects backwards start offsets", () => {
    const stages = baseStages();
    stages[2].defaultStartOffsetDays = -1; // Emergence starts before Sowing
    stages[2].minStartOffsetDays = -5;
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "START_OFFSET_DECREASES")).toBe(true);
  });

  it("rejects end-before-start on a single stage", () => {
    const stages = baseStages();
    stages[2].defaultEndOffsetDays = 2; // ends before its own start (5)
    stages[2].minEndOffsetDays = -5;
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "END_BEFORE_START")).toBe(true);
  });

  it("rejects invalid min/default/max ordering", () => {
    const stages = baseStages();
    stages[1].minStartOffsetDays = 5; // min > default
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MIN_DEFAULT_MAX_ORDER")).toBe(true);
  });

  it("rejects duplicate sequence numbers", () => {
    const stages = baseStages();
    stages[2].sequence = 2; // duplicate of Sowing
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEQUENCE_DUPLICATE")).toBe(true);
  });

  it("rejects a gap in sequence numbers", () => {
    const stages = baseStages();
    stages[2].sequence = 4; // skips 3
    const result = validateStageConfig(stages);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SEQUENCE_GAP")).toBe(true);
  });

  it("rejects an empty configuration", () => {
    const result = validateStageConfig([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("EMPTY_CONFIG");
  });

  it("all seeded crop configurations (every crop + planting type) pass validation", () => {
    for (const crop of CROP_DEFINITIONS) {
      for (const [plantingType, defs] of Object.entries(crop.stagesByPlantingType)) {
        const configs = toStageConfigs(
          defs,
          plantingType === "none" ? null : (plantingType as StageConfig["plantingType"]),
          `${crop.name}-${plantingType}`
        );
        const result = validateStageConfig(configs);
        expect(result.valid, `${crop.name} (${plantingType}): ${JSON.stringify(result.errors)}`).toBe(
          true
        );
      }
    }
  });
});
