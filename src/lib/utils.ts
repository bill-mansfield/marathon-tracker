import type { PlanWeek, ProgressMap } from "../data/types";

export function getWeekActualKm(
  week: PlanWeek,
  weekIndex: number,
  progress: ProgressMap
): number {
  return week.days.reduce((sum, day) => {
    const key = `${weekIndex}-${day.day}`;
    const p = progress[key];
    if (!p?.completed) return sum;
    return sum + (p.actualKm ?? day.km);
  }, 0);
}

export function isRestDay(description: string, km: number): boolean {
  return km === 0 && !description.toLowerCase().includes("shakeout");
}

export function getRunnableDays(week: PlanWeek) {
  return week.days.filter((d) => !isRestDay(d.description, d.km));
}

export function getCompletedCount(
  week: PlanWeek,
  weekIndex: number,
  progress: ProgressMap
): number {
  return getRunnableDays(week).filter((d) => {
    const key = `${weekIndex}-${d.day}`;
    return progress[key]?.completed;
  }).length;
}
