export type DayName = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface PlanDay {
  day: DayName;
  km: number;
  description: string;
}

export interface PlanWeek {
  weekStart: string; // ISO date e.g. "2026-03-09"
  weekType: string;
  days: PlanDay[];
  totalKm: number;
  notes: string;
  longRunPlan: string;
}

export interface RunProgress {
  completed: boolean;
  rating: 0 | 1 | 2 | 3;
  note: string;
  stravaUrl: string;
  stravaActivityId?: number;
  actualKm: number | null; // null = use planned km when completed
  description?: string;
  isExtra?: boolean;
  deleted?: boolean;
}

export type ProgressMap = Record<string, RunProgress>;

// --- Multi-plan types ---

export type GoalDistance = "5k" | "10k" | "half" | "marathon" | "50k" | "100k" | "custom";
export type RaceType = "flat" | "trail";
export type PlanStatus = "draft" | "in_progress" | "completed";

export interface PlanGeneratorOptions {
  deloads: boolean;
  strides: boolean;
  surges: boolean;
  elevation: boolean;
  longRuns: boolean;
  tempo: boolean;
  easy: boolean;
  strength: boolean;
}

export interface PlanGeneratorConfig {
  goal: GoalDistance;
  raceType: RaceType;
  targetElevationM?: number;
  currentWeeklyKm: number;
  raceDate: string; // ISO date
  startDate?: string; // ISO date — defaults to today if not provided
  customDistanceKm?: number;
  volumeIncreasePct: number;
  options: PlanGeneratorOptions;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  status: PlanStatus;
  goal: GoalDistance;
  race_type: RaceType;
  target_elevation_m: number | null;
  current_weekly_km: number;
  race_date: string;
  volume_increase_pct: number;
  options: PlanGeneratorOptions;
  weeks: PlanWeek[];
  created_at: string;
  updated_at: string;
}
