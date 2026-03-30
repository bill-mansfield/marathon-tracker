import type { ProgressMap } from "../data/types";

const PROGRESS_KEY = "marathon-tracker-progress";

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
