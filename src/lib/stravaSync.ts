import { parseISO, addDays, min, format } from "date-fns";
import type { DayName, ProgressMap, RunProgress, TrainingPlan } from "../data/types";
import { getProgressKey } from "./utils";
import { supabase } from "./supabase";

const DAY_OFFSETS: Record<DayName, number> = {
  MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
};

interface StravaRun {
  id: number;
  name: string;
  distanceKm: number;
  date: string; // YYYY-MM-DD
  type: string;
}

export interface SyncResult {
  patch: Partial<ProgressMap>;
  count: number;
}

export async function syncStravaActivities(
  plan: TrainingPlan,
  currentProgress: ProgressMap
): Promise<SyncResult> {
  if (!supabase) throw new Error("Supabase not configured");

  // Date range: plan start → min(today, race date)
  const planStart = parseISO(plan.weeks[0].weekStart);
  const raceDate = parseISO(plan.race_date);
  const today = new Date();
  const planEnd = min([today, raceDate]);

  const after = Math.floor(planStart.getTime() / 1000);
  const before = Math.floor(planEnd.getTime() / 1000) + 86400; // include end day

  // The edge function reads after/before as URL query params
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(
    `${supabaseUrl}/functions/v1/strava-activities?after=${after}&before=${before}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Strava fetch failed (${res.status})`);
  }

  const { runs }: { runs: StravaRun[] } = await res.json();

  // Build a map of date → runs for fast lookup
  const byDate = new Map<string, StravaRun[]>();
  for (const run of runs) {
    const list = byDate.get(run.date) ?? [];
    list.push(run);
    byDate.set(run.date, list);
  }

  // Match Strava runs to plan days
  const patch: Partial<ProgressMap> = {};
  let count = 0;

  for (let wi = 0; wi < plan.weeks.length; wi++) {
    const week = plan.weeks[wi];
    const weekStart = parseISO(week.weekStart);

    for (const day of week.days) {
      if (day.km === 0) continue; // rest day — skip

      const key = getProgressKey(wi, day.day);
      const existing = currentProgress[key];

      // Don't overwrite if already synced from Strava
      if (existing?.stravaActivityId) continue;

      const dayDate = format(addDays(weekStart, DAY_OFFSETS[day.day]), "yyyy-MM-dd");
      const candidates = byDate.get(dayDate);
      if (!candidates || candidates.length === 0) continue;

      // Pick the activity with distance closest to planned km
      const best = candidates.reduce((a, b) =>
        Math.abs(a.distanceKm - day.km) <= Math.abs(b.distanceKm - day.km) ? a : b
      );

      const base: RunProgress = existing ?? {
        completed: false,
        rating: 0,
        note: "",
        stravaUrl: "",
        actualKm: null,
        deleted: false,
      };
      patch[key] = {
        ...base,
        completed: true,
        actualKm: best.distanceKm,
        stravaUrl: `https://www.strava.com/activities/${best.id}`,
        stravaActivityId: best.id,
      };
      count++;
    }
  }

  return { patch, count };
}

export async function getStravaProfile(): Promise<{
  connected: boolean;
  athleteName?: string;
} > {
  if (!supabase) return { connected: false };

  const { data, error } = await supabase
    .from("profiles")
    .select("strava_tokens, strava_athlete_id")
    .single();

  if (error || !data?.strava_tokens) return { connected: false };

  const tokens = data.strava_tokens as { athlete?: { firstname?: string; lastname?: string } };
  const name = tokens.athlete
    ? `${tokens.athlete.firstname ?? ""} ${tokens.athlete.lastname ?? ""}`.trim()
    : undefined;

  return { connected: true, athleteName: name };
}

export async function disconnectStrava(): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("profiles")
    .update({ strava_tokens: null, strava_athlete_id: null });
}
