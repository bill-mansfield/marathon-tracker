import type {
  DayName,
  PlanWeek,
  ProgressMap,
  RunProgress,
} from "../data/types";

export const DEFAULT_PROGRESS: RunProgress = {
  completed: false,
  rating: 0,
  note: "",
  stravaUrl: "",
  actualKm: null,
  deleted: false,
};

export function getProgressKey(weekIndex: number, day: DayName): string {
  return `${weekIndex}-${day}`;
}

export function getExtraRunKey(weekIndex: number, day: DayName): string {
  return `${weekIndex}-${day}-extra-${crypto.randomUUID()}`;
}

export function getExtraRunsForDay(
  weekIndex: number,
  day: DayName,
  progress: ProgressMap
): Array<[string, RunProgress]> {
  const prefix = `${weekIndex}-${day}-extra-`;
  return Object.entries(progress).filter(
    ([key, value]) => key.startsWith(prefix) && value.isExtra
  );
}

function getRunDistance(run: RunProgress, plannedKm: number): number {
  return run.actualKm ?? plannedKm;
}

export function getWeekActualKm(
  week: PlanWeek,
  weekIndex: number,
  progress: ProgressMap
): number {
  return week.days.reduce((sum, day) => {
    const key = getProgressKey(weekIndex, day.day);
    const p = progress[key];
    const plannedKm =
      p?.completed && !p.deleted ? getRunDistance(p, day.km) : 0;
    const extraKm = getExtraRunsForDay(weekIndex, day.day, progress).reduce(
      (daySum, [, extra]) =>
        extra.completed ? daySum + getRunDistance(extra, 0) : daySum,
      0
    );
    return sum + plannedKm + extraKm;
  }, 0);
}

export function isRestDay(description: string, km: number, isStrength?: boolean): boolean {
  if (isStrength) return false;
  return km === 0 && !description.toLowerCase().includes("shakeout");
}

export function getRunTotals(
  week: PlanWeek,
  weekIndex: number,
  progress: ProgressMap
): { total: number; completed: number } {
  return week.days.reduce(
    (totals, day) => {
      const key = getProgressKey(weekIndex, day.day);
      const plannedIsRunnable = !isRestDay(day.description, day.km, day.isStrength);
      const extras = getExtraRunsForDay(weekIndex, day.day, progress);
      const plannedRun = progress[key];

      if (plannedIsRunnable && !plannedRun?.deleted) {
        totals.total += 1;
        if (plannedRun?.completed) totals.completed += 1;
      }

      totals.total += extras.length;
      totals.completed += extras.filter(([, extra]) => extra.completed).length;

      return totals;
    },
    { total: 0, completed: 0 }
  );
}
