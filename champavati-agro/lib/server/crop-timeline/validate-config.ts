import type { StageConfig, ValidationError, ValidationResult } from "./types";

/**
 * Stage-configuration consistency layer — server/business-logic level, never UI-only.
 * Runs per crop + plantingType. `stages` must already be filtered to one
 * (cropMasterId, plantingType) group and does not need to be pre-sorted.
 *
 * Offsets are signed and relative to the crop's anchor date: negative stages
 * (e.g. Land Preparation before Sowing) are valid, zero is valid (the anchor
 * stage itself), and positive is valid. There is no "days after sowing" —
 * only start/end offsets.
 */
export function validateStageConfig(stages: StageConfig[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (stages.length === 0) {
    return { valid: false, errors: [{ code: "EMPTY_CONFIG", message: "No stages configured." }] };
  }

  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);

  // 1. Sequence numbers continuous (1..n, no gaps, no duplicates).
  const seen = new Set<number>();
  sorted.forEach((s) => {
    if (seen.has(s.sequence)) {
      errors.push({
        code: "SEQUENCE_DUPLICATE",
        message: `Sequence ${s.sequence} is used by more than one stage.`,
        stageSequence: s.sequence,
      });
    }
    seen.add(s.sequence);
  });
  for (let i = 1; i <= sorted.length; i++) {
    if (!seen.has(i)) {
      errors.push({
        code: "SEQUENCE_GAP",
        message: `Sequence ${i} is missing — stage sequences must be continuous starting at 1.`,
        stageSequence: i,
      });
    }
  }

  // 4. min <= default <= max for both start and end offsets, per stage.
  //    3. end offset >= start offset, per stage.
  for (const s of sorted) {
    if (!(s.minStartOffsetDays <= s.defaultStartOffsetDays && s.defaultStartOffsetDays <= s.maxStartOffsetDays)) {
      errors.push({
        code: "MIN_DEFAULT_MAX_ORDER",
        message: `"${s.name}": start offset must satisfy min <= default <= max (got ${s.minStartOffsetDays} <= ${s.defaultStartOffsetDays} <= ${s.maxStartOffsetDays}).`,
        stageSequence: s.sequence,
      });
    }
    if (!(s.minEndOffsetDays <= s.defaultEndOffsetDays && s.defaultEndOffsetDays <= s.maxEndOffsetDays)) {
      errors.push({
        code: "MIN_DEFAULT_MAX_ORDER",
        message: `"${s.name}": end offset must satisfy min <= default <= max (got ${s.minEndOffsetDays} <= ${s.defaultEndOffsetDays} <= ${s.maxEndOffsetDays}).`,
        stageSequence: s.sequence,
      });
    }
    if (s.defaultEndOffsetDays < s.defaultStartOffsetDays) {
      errors.push({
        code: "END_BEFORE_START",
        message: `"${s.name}": end offset (${s.defaultEndOffsetDays}) is before its start offset (${s.defaultStartOffsetDays}).`,
        stageSequence: s.sequence,
      });
    }
  }

  // 2. Start offsets non-decreasing across the sequence.
  // 3. No overlap: stage N's default end offset <= stage N+1's default start offset.
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (next.defaultStartOffsetDays < cur.defaultStartOffsetDays) {
      errors.push({
        code: "START_OFFSET_DECREASES",
        message: `"${next.name}" starts (day ${next.defaultStartOffsetDays}) before "${cur.name}" starts (day ${cur.defaultStartOffsetDays}).`,
        stageSequence: next.sequence,
      });
    }
    if (next.defaultStartOffsetDays < cur.defaultEndOffsetDays) {
      errors.push({
        code: "STAGE_OVERLAP",
        message: `"${cur.name}" (ends day ${cur.defaultEndOffsetDays}) overlaps "${next.name}" (starts day ${next.defaultStartOffsetDays}).`,
        stageSequence: next.sequence,
      });
    }
  }

  // 5. Final stage must yield a sensible expected-harvest window.
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalCycleDays = last.defaultEndOffsetDays - first.defaultStartOffsetDays;
  if (!Number.isFinite(totalCycleDays) || totalCycleDays <= 0 || totalCycleDays > 730) {
    errors.push({
      code: "IMPLAUSIBLE_HARVEST_WINDOW",
      message: `The configured cycle length (${totalCycleDays} days, from "${first.name}" to "${last.name}") is not a plausible crop cycle.`,
    });
  }

  return { valid: errors.length === 0, errors };
}
