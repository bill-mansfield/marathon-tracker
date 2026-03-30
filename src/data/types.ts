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
  actualKm: number | null; // null = use planned km when completed
}

export type ProgressMap = Record<string, RunProgress>;
