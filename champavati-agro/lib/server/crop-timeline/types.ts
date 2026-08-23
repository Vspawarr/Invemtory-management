import type { AnchorType, ConfidenceLevel, PlantingType, RainfallStatus } from "@prisma/client";

/** Minimal shape of a CropStageMaster row needed to compute a timeline — decoupled from
 * Prisma so the engine stays pure and unit-testable without a database. */
export interface StageConfig {
  id: string;
  name: string;
  localName: string;
  plantingType: PlantingType | null;
  sequence: number;
  minStartOffsetDays: number;
  defaultStartOffsetDays: number;
  maxStartOffsetDays: number;
  minEndOffsetDays: number;
  defaultEndOffsetDays: number;
  maxEndOffsetDays: number;
  criticalStage: boolean;
  waterSensitive: boolean;
  weatherSensitive: boolean;
  monitoringActions: string | null;
  commonPests: string[];
  commonDiseases: string[];
  sourceReference?: string | null;
  confidenceLevel?: ConfidenceLevel;
}

/** The engine is anchor-terminology-agnostic: it computes purely from `anchorDate`
 * regardless of whether the crop calls it sowing, planting, or transplanting. */
export interface TimelineInput {
  cropMasterId: string;
  anchorDate: Date;
  anchorType: AnchorType;
  plantingType?: PlantingType | null;
  variety?: string | null;
  irrigationAvailable: boolean;
  weatherContext?: { rainfallStatus: RainfallStatus } | null;
}

export interface CalculatedStage {
  stageMasterId: string;
  name: string;
  localName: string;
  sequence: number;
  startOffsetDays: number;
  endOffsetDays: number;
  expectedStartDate: Date;
  expectedEndDate: Date;
  criticalStage: boolean;
  waterSensitive: boolean;
  weatherSensitive: boolean;
  monitoringActions: string | null;
  commonPests: string[];
  commonDiseases: string[];
}

export interface CalculatedTimeline {
  stages: CalculatedStage[];
  expectedHarvestDate: Date;
}

export type ValidationErrorCode =
  | "SEQUENCE_GAP"
  | "SEQUENCE_DUPLICATE"
  | "START_OFFSET_DECREASES"
  | "END_BEFORE_START"
  | "STAGE_OVERLAP"
  | "MIN_DEFAULT_MAX_ORDER"
  | "IMPLAUSIBLE_HARVEST_WINDOW"
  | "EMPTY_CONFIG";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  stageSequence?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class TimelineConfigError extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(
      `Crop stage configuration is inconsistent: ${errors.map((e) => e.message).join("; ")}`
    );
    this.name = "TimelineConfigError";
    this.errors = errors;
  }
}
