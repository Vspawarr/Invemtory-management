// Shared cricket display/formatting helpers. The database is always the
// source of truth for balls_bowled / total_runs; these functions only format
// what's already been authoritatively computed.

export function ballsToOversLabel(balls: number): string {
  const completedOvers = Math.floor(balls / 6);
  const ballInOver = balls % 6;
  return `${completedOvers}.${ballInOver}`;
}

export function oversAsDecimal(balls: number): number {
  return Math.floor(balls / 6) + (balls % 6) / 6;
}

export function runRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Math.round((runs / (balls / 6)) * 100) / 100;
}

export function requiredRunRate(target: number, runsSoFar: number, ballsRemaining: number): number | null {
  if (ballsRemaining <= 0) return null;
  const runsNeeded = target - runsSoFar;
  if (runsNeeded <= 0) return 0;
  return Math.round((runsNeeded / (ballsRemaining / 6)) * 100) / 100;
}

export function maxBallsForOvers(overs: number): number {
  return overs * 6;
}

export const DISMISSAL_LABELS: Record<string, string> = {
  BOWLED: 'Bowled',
  CAUGHT: 'Caught',
  RUN_OUT: 'Run Out',
  LBW: 'LBW',
  STUMPED: 'Stumped',
  HIT_WICKET: 'Hit Wicket',
  OTHER: 'Other',
};

export const STAGE_LABELS: Record<string, string> = {
  LEAGUE: 'League',
  PRE_KNOCKOUT: 'Pre-Knockout',
  QUARTER_FINAL: 'Quarter Final',
  SEMI_FINAL: 'Semi Final',
  FINAL: 'Final',
};

export const KNOCKOUT_STAGES = new Set(['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL']);

export function isKnockoutStage(stage: string): boolean {
  return KNOCKOUT_STAGES.has(stage);
}

export const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Upcoming',
  REGISTRATION_OPEN: 'Registration Open',
  LIVE: 'Live',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
  CANCELLED: 'Cancelled',
};

export function formatEventLabel(event: {
  event_type: string;
  runs: number;
  is_wicket: boolean;
}): string {
  if (event.is_wicket) return 'W';
  if (event.event_type === 'WIDE') return `Wd+${event.runs}`;
  if (event.event_type === 'NO_BALL') return `Nb+${event.runs}`;
  if (event.event_type === 'CORRECTION') return `${event.runs >= 0 ? '+' : ''}${event.runs}`;
  return event.runs === 0 ? '•' : `${event.runs}`;
}
