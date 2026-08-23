import type { Prisma } from "@prisma/client";

import { determineStageStatus } from "./rules";
import type { CalculatedTimeline } from "./types";

/**
 * Builds the CropTimelineStage rows for a newly created crop. This is the
 * one-time snapshot from CalculatedTimeline + CropStageMaster — after this,
 * editing CropStageMaster never touches these rows again (historical
 * immutability). Callers persist the result inside the crop-creation
 * transaction (see lib/server/actions/crops.ts).
 */
export function buildTimelineStageSnapshots(
  timeline: CalculatedTimeline,
  today: Date = new Date()
): Omit<Prisma.CropTimelineStageCreateManyCropInput, "cropId">[] {
  return timeline.stages.map((stage) => ({
    stageMasterId: stage.stageMasterId,
    stageNameSnapshot: stage.name,
    localNameSnapshot: stage.localName,
    sequenceSnapshot: stage.sequence,
    startOffsetDaysSnapshot: stage.startOffsetDays,
    endOffsetDaysSnapshot: stage.endOffsetDays,
    expectedStartDate: stage.expectedStartDate,
    expectedEndDate: stage.expectedEndDate,
    status: determineStageStatus(
      { expectedStartDate: stage.expectedStartDate, expectedEndDate: stage.expectedEndDate },
      today
    ),
    criticalStageSnapshot: stage.criticalStage,
    waterSensitiveSnapshot: stage.waterSensitive,
    weatherSensitiveSnapshot: stage.weatherSensitive,
    monitoringActionsSnapshot: stage.monitoringActions,
    commonPestsSnapshot: stage.commonPests,
    commonDiseasesSnapshot: stage.commonDiseases,
  }));
}
