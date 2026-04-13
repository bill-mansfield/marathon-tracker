import { useState, useEffect, useCallback, useRef } from "react";
import type { PlanWeek, ProgressMap, RunProgress, TrainingPlan } from "../data/types";
import { DEFAULT_PROGRESS } from "../lib/utils";
import { supabase } from "../lib/supabase";

interface PlanData {
  plan: TrainingPlan | null;
  weeks: PlanWeek[];
  progress: ProgressMap;
  loading: boolean;
  error: string | null;
  updateProgress: (key: string, patch: Partial<RunProgress>) => void;
  updatePlan: (patch: Partial<Pick<TrainingPlan, "name" | "status">>) => Promise<void>;
}

export function usePlanData(planId: string): PlanData {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(
    supabase ? null : "Supabase not configured"
  );
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingUpserts = useRef<Map<string, RunProgress>>(new Map());

  // Fetch plan + progress from Supabase
  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      const { data: planData, error: planErr } = await supabase!
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (cancelled) return;
      if (planErr || !planData) {
        setError(planErr?.message ?? "Plan not found");
        setLoading(false);
        return;
      }

      setPlan(planData as TrainingPlan);

      const { data: progressRows, error: progErr } = await supabase!
        .from("progress")
        .select("*")
        .eq("plan_id", planId);

      if (cancelled) return;
      if (progErr) {
        setError(progErr.message);
        setLoading(false);
        return;
      }

      // Convert rows to ProgressMap
      const map: ProgressMap = {};
      for (const row of progressRows ?? []) {
        map[row.day_key] = {
          completed: row.completed,
          rating: row.rating,
          note: row.note,
          stravaUrl: row.strava_url,
          actualKm: row.actual_km,
          description: row.description ?? undefined,
          isExtra: row.is_extra || undefined,
          deleted: row.deleted || undefined,
        };
      }
      setProgress(map);
      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [planId]);

  // Debounced sync to Supabase
  const flushToSupabase = useCallback(async () => {
    if (!supabase || pendingUpserts.current.size === 0) return;

    const entries = Array.from(pendingUpserts.current.entries());
    pendingUpserts.current.clear();

    const rows = entries.map(([dayKey, p]) => ({
      plan_id: planId,
      day_key: dayKey,
      completed: p.completed,
      rating: p.rating,
      note: p.note,
      strava_url: p.stravaUrl,
      actual_km: p.actualKm,
      description: p.description ?? null,
      is_extra: p.isExtra ?? false,
      deleted: p.deleted ?? false,
    }));

    await supabase
      .from("progress")
      .upsert(rows, { onConflict: "plan_id,day_key" });
  }, [planId]);

  const updateProgress = useCallback(
    (key: string, patch: Partial<RunProgress>) => {
      setProgress((prev) => {
        const updated = {
          ...DEFAULT_PROGRESS,
          ...(prev[key] ?? {}),
          ...patch,
        };
        pendingUpserts.current.set(key, updated);

        // Debounce the sync
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => void flushToSupabase(), 500);

        return { ...prev, [key]: updated };
      });
    },
    [flushToSupabase]
  );

  const updatePlan = useCallback(
    async (patch: Partial<Pick<TrainingPlan, "name" | "status">>) => {
      if (!supabase || !plan) return;
      const { error: err } = await supabase
        .from("plans")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", planId);
      if (!err) {
        setPlan((prev) => (prev ? { ...prev, ...patch } : prev));
      }
    },
    [plan, planId]
  );

  return {
    plan,
    weeks: plan?.weeks ?? [],
    progress,
    loading,
    error,
    updateProgress,
    updatePlan,
  };
}
