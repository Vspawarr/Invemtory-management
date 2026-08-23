import { differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears } from "date-fns";

/**
 * Human-readable relationship duration since a farmer's registration date
 * (Farmer.createdAt) — never guessed, always derived. Days for a farmer
 * registered under a month ago, months for under two years, years+months
 * beyond that.
 */
export function formatRelationshipDuration(since: Date, today: Date = new Date()): string {
  const days = differenceInCalendarDays(today, since);
  if (days <= 0) return "New today";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;

  const months = differenceInCalendarMonths(today, since);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;

  const years = differenceInCalendarYears(today, since);
  const remainderMonths = differenceInCalendarMonths(today, since) - years * 12;
  return remainderMonths === 0
    ? `${years} year${years === 1 ? "" : "s"}`
    : `${years}y ${remainderMonths}m`;
}
