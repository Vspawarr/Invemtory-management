import type { TimelineStageStatus } from "@prisma/client";

export interface StageDates {
  expectedStartDate: Date;
  expectedEndDate: Date;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
}

/**
 * Determines a single stage's status from calendar evidence only (no
 * knowledge of the crop's actual current-stage progression). Used to pick
 * an initial current stage at crop creation, and as the building block for
 * `computeCropStageStatuses` below.
 *
 * `graceDays` absorbs small real-world slack before a stage is flagged
 * delayed (default 0 — exact comparison).
 */
export function determineStageStatus(
  stage: StageDates,
  today: Date = new Date(),
  graceDays = 0
): TimelineStageStatus {
  if (stage.actualEndDate) return "COMPLETED";

  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const expectedEndWithGrace = new Date(stage.expectedEndDate.getTime() + graceMs);

  if (stage.actualStartDate) {
    // Started but not finished yet.
    return today > expectedEndWithGrace ? "DELAYED" : "CURRENT";
  }

  if (today < stage.expectedStartDate) return "UPCOMING";
  if (today <= expectedEndWithGrace) return "CURRENT";
  return "DELAYED";
}

/** Recomputes every stage's status for a crop's timeline in one pass, from calendar evidence only. */
export function determineTimelineStatuses<T extends StageDates>(
  stages: T[],
  today: Date = new Date(),
  graceDays = 0
): (T & { status: TimelineStageStatus })[] {
  return stages.map((s) => ({ ...s, status: determineStageStatus(s, today, graceDays) }));
}

export interface ProgressionAwareStage extends StageDates {
  sequence: number;
}

/**
 * Status of the ONE stage a crop is confirmed to be at (`currentStageSequence
 * === stage.sequence`), with no `actualEndDate` recorded yet. Extracted so
 * `computeCropStageStatuses` and single-stage callers (list views that only
 * loaded `crop.currentStage`, not the whole timeline) share the exact same
 * rule rather than a second copy of it. See `computeCropStageStatuses` for
 * the full reasoning.
 */
export function confirmedCurrentStageStatus(
  stage: StageDates,
  today: Date,
  graceDays = 0,
  staleAfterDays = 30
): TimelineStageStatus {
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const expectedEndWithGrace = new Date(stage.expectedEndDate.getTime() + graceMs);

  if (stage.actualStartDate) {
    return today > expectedEndWithGrace ? "DELAYED" : "CURRENT";
  }

  const staleMs = staleAfterDays * 24 * 60 * 60 * 1000;
  const staleCutoff = new Date(stage.expectedEndDate.getTime() + staleMs);
  return today > staleCutoff ? "NEEDS_REVIEW" : "CURRENT";
}

/**
 * The single source of truth for per-stage status, used by Crop 360, the
 * farmer portal, and (via `isStatusConcerning`) the admin dashboard's
 * Delayed Crops KPI — one definition of "delayed," never a second
 * contradictory one in a different layer.
 *
 * Combines two kinds of evidence:
 *  1. Progression evidence — the crop's recorded `currentStageSequence`
 *     (Crop.currentStage, advanced explicitly by an admin). A stage before
 *     the current one is known to be COMPLETED even without an actual date
 *     recorded for it individually — you can't be in Vegetative Growth
 *     without having passed through Sowing. A stage after it is UPCOMING
 *     regardless of what the original calendar window says, because the
 *     crop simply hasn't been advanced there yet — that alone isn't
 *     evidence of delay.
 *  2. Calendar evidence — for the stage the crop is actually AT, compare
 *     today against its expected window. Only a stage with a recorded
 *     actualStartDate that is overrunning becomes DELAYED (confirmed
 *     evidence of a problem); a stage with no actual entry yet whose
 *     window has simply passed is NEEDS_REVIEW — softer, since nothing
 *     confirms a problem OR confirms progress, so it prompts an admin to
 *     check rather than accusing the crop of being behind schedule.
 *
 * `currentStageSequence: null` (e.g. immediately after creation, before an
 * admin has ever advanced the crop) falls back to pure calendar evidence
 * for every stage via `determineStageStatus`.
 */
export function computeCropStageStatuses<T extends ProgressionAwareStage>(
  stages: T[],
  currentStageSequence: number | null,
  today: Date = new Date(),
  graceDays = 0,
  /** How many days past a confirmed current stage's own expected end date
   * before that confirmation itself is treated as stale and flagged
   * NEEDS_REVIEW — otherwise a stage confirmed once would stay CURRENT
   * forever, even for a crop nobody has checked on in months. */
  staleAfterDays = 30
): (T & { status: TimelineStageStatus })[] {
  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);

  return sorted.map((s) => {
    if (s.actualEndDate) return { ...s, status: "COMPLETED" as TimelineStageStatus };

    if (currentStageSequence !== null && s.sequence < currentStageSequence) {
      return { ...s, status: "COMPLETED" as TimelineStageStatus };
    }
    if (currentStageSequence !== null && s.sequence > currentStageSequence) {
      return { ...s, status: "UPCOMING" as TimelineStageStatus };
    }

    const graceMs = graceDays * 24 * 60 * 60 * 1000;
    const expectedEndWithGrace = new Date(s.expectedEndDate.getTime() + graceMs);

    // This is the stage the crop is confirmed to be at (sequence ===
    // currentStageSequence). An explicit admin confirmation of progression
    // outranks a passive calendar guess, so trust it and show CURRENT
    // rather than second-guessing the admin the moment the original
    // expected window elapses — UNLESS that confirmation is now old enough
    // (default 30 days past the stage's own expected end) that it's likely
    // just stale/forgotten, not evidence the crop is still genuinely there.
    if (currentStageSequence !== null && s.sequence === currentStageSequence) {
      return { ...s, status: confirmedCurrentStageStatus(s, today, graceDays, staleAfterDays) };
    }

    // No progression confirmation exists at all yet (currentStageSequence
    // is null) — fall back to pure calendar evidence.
    if (today < s.expectedStartDate) return { ...s, status: "UPCOMING" as TimelineStageStatus };
    if (today <= expectedEndWithGrace) return { ...s, status: "CURRENT" as TimelineStageStatus };
    return { ...s, status: "NEEDS_REVIEW" as TimelineStageStatus };
  });
}

/**
 * A sensible starting guess for a newly created crop's current stage: the
 * last stage (by sequence) whose expected window has already begun by
 * `today`, i.e. "assume progress has followed the calendar until an admin
 * says otherwise." Falls back to the first stage if the anchor date is in
 * the future (nothing has started yet). This is only ever an initial
 * guess — `advanceCropStageAction` lets an admin correct it with real
 * evidence at any time.
 */
export function guessInitialCurrentStage<T extends { sequence: number; expectedStartDate: Date }>(
  stages: T[],
  today: Date = new Date()
): T | null {
  if (stages.length === 0) return null;
  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);
  const started = sorted.filter((s) => s.expectedStartDate <= today);
  return started.length > 0 ? started[started.length - 1] : sorted[0];
}

/** Shared definition of "this needs an admin's attention" — used consistently
 * across Crop 360, the farmer portal, and the dashboard's Delayed Crops KPI. */
export function isStatusConcerning(status: TimelineStageStatus): boolean {
  return status === "DELAYED" || status === "NEEDS_REVIEW";
}

export interface CropStageDisplay {
  /** The stage sequence the crop is confirmed to be at (Crop.currentStage),
   * or null if an admin has never advanced this crop. */
  confirmedSequence: number | null;
  /** That confirmed stage's own status — CURRENT/DELAYED/NEEDS_REVIEW — or
   * null when nothing has ever been confirmed. Computed via
   * `computeCropStageStatuses`, never re-derived separately, so this can
   * never disagree with what the timeline itself renders for that stage. */
  confirmedStatus: TimelineStageStatus | null;
  /** What the calendar alone (anchorDate + offsets, no admin input) implies
   * the current stage should be today — via `guessInitialCurrentStage`. */
  expectedSequence: number | null;
  /** True when the confirmed stage isn't trustworthy enough to present on
   * its own as "Current Stage": either nothing has ever been confirmed, or
   * the confirmation has gone stale. Callers should show the expected
   * stage alongside an "actual stage not confirmed" note instead of a bare
   * (and possibly false) "Current Stage: X" line. */
  needsReview: boolean;
}

/**
 * The single domain-level reconciliation of "what stage is this crop at,
 * really" — the one function every surface (Crop 360, farmer crop pages,
 * crop list rows) should read instead of independently trusting
 * `Crop.currentStage.stageNameSnapshot` at face value. A raw confirmed-stage
 * name with no staleness check is exactly how a header can end up reading
 * "Current Stage: Sowing" for a 114-day-old, unmonitored crop while the
 * timeline underneath it already (correctly) flags that same stage
 * NEEDS_REVIEW — two displays of one fact disagreeing because only one of
 * them ran it through `computeCropStageStatuses`.
 */
export function getCropStageDisplay<T extends ProgressionAwareStage & { expectedStartDate: Date }>(
  stages: T[],
  currentStageSequence: number | null,
  today: Date = new Date(),
  staleAfterDays = 30
): CropStageDisplay {
  const statuses = computeCropStageStatuses(stages, currentStageSequence, today, 0, staleAfterDays);
  const confirmedStatus =
    currentStageSequence !== null
      ? (statuses.find((s) => s.sequence === currentStageSequence)?.status ?? null)
      : null;
  const expected = guessInitialCurrentStage(stages, today);

  return {
    confirmedSequence: currentStageSequence,
    confirmedStatus,
    expectedSequence: expected?.sequence ?? null,
    needsReview: confirmedStatus === null || confirmedStatus === "NEEDS_REVIEW",
  };
}

