import type { RainfallStatus } from "@prisma/client";

/**
 * Advisory-only parameterization. These strings never change a date, never
 * change a stage status, and never prescribe a product — they are shown to
 * the admin alongside the timeline as monitoring context. The farmer's
 * actual anchor date is always the source of truth for the schedule.
 */
const ADVISORIES: Record<RainfallStatus, string> = {
  NORMAL: "Rainfall conditions are normal for this stage.",
  DELAYED_MONSOON: "Sowing conditions may be delayed. Verify field moisture before sowing.",
  DRY_SPELL: "Monitor soil moisture and crop stress.",
  EXCESS_RAIN: "Excess rainfall: monitor drainage, waterlogging and disease symptoms.",
};

export function getWeatherAdvisory(status: RainfallStatus): string {
  return ADVISORIES[status];
}
