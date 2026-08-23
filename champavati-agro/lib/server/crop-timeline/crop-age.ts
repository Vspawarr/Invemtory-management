import { differenceInCalendarDays } from "date-fns";

/**
 * Days since the crop's anchor date (sowing/planting/transplanting).
 * Always `today - anchorDate` — never createdAt, a stage date, or the
 * expected harvest date. Negative for a crop whose anchor is still in the
 * future (not yet sown/planted).
 */
export function calculateCropAgeDays(anchorDate: Date, today: Date = new Date()): number {
  return differenceInCalendarDays(today, anchorDate);
}
