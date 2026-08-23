import { addDays } from "date-fns";

import { validateStageConfig } from "./validate-config";
import type { CalculatedTimeline, StageConfig, TimelineInput } from "./types";
import { TimelineConfigError } from "./types";

/**
 * Pure, testable timeline calculation. `stageConfigs` must already be the
 * right set for this crop + planting type (the caller is responsible for
 * that filtering — this function does not touch the database).
 *
 * expectedStart = anchorDate + defaultStartOffsetDays
 * expectedEnd   = anchorDate + defaultEndOffsetDays
 *
 * Offsets are signed, so pre-anchor stages (Land Preparation, Nursery
 * Preparation, Seed Rhizome Treatment, …) resolve to dates before the
 * anchor. The anchor date itself is never shifted by this function — it is
 * the immutable input, never recomputed or guessed from a calendar.
 */
export function calculateCropTimeline(
  input: TimelineInput,
  stageConfigs: StageConfig[]
): CalculatedTimeline {
  const { valid, errors } = validateStageConfig(stageConfigs);
  if (!valid) {
    throw new TimelineConfigError(errors);
  }

  const sorted = [...stageConfigs].sort((a, b) => a.sequence - b.sequence);

  const stages = sorted.map((s) => ({
    stageMasterId: s.id,
    name: s.name,
    localName: s.localName,
    sequence: s.sequence,
    startOffsetDays: s.defaultStartOffsetDays,
    endOffsetDays: s.defaultEndOffsetDays,
    expectedStartDate: addDays(input.anchorDate, s.defaultStartOffsetDays),
    expectedEndDate: addDays(input.anchorDate, s.defaultEndOffsetDays),
    criticalStage: s.criticalStage,
    waterSensitive: s.waterSensitive,
    weatherSensitive: s.weatherSensitive,
    monitoringActions: s.monitoringActions,
    commonPests: s.commonPests,
    commonDiseases: s.commonDiseases,
  }));

  const expectedHarvestDate = stages[stages.length - 1].expectedEndDate;

  return { stages, expectedHarvestDate };
}
