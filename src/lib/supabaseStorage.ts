import { supabase } from "./supabase";
import type { TrainingPlan, PlanWeek, PlanGeneratorOptions, GoalDistance, RaceType, PlanStatus } from "../data/types";

export async function fetchUserPlans(): Promise<TrainingPlan[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrainingPlan[];
}

export async function createPlan(plan: {
  name: string;
  goal: GoalDistance;
  race_type: RaceType;
  target_elevation_m: number | null;
  current_weekly_km: number;
  race_date: string;
  volume_increase_pct: number;
  options: PlanGeneratorOptions;
  weeks: PlanWeek[];
  status?: PlanStatus;
}): Promise<TrainingPlan> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("plans")
    .insert({
      user_id: user.id,
      ...plan,
      status: plan.status ?? "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TrainingPlan;
}

export async function updatePlanStatus(
  planId: string,
  status: PlanStatus
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("plans")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", planId);
  if (error) throw new Error(error.message);
}

export async function deletePlan(planId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw new Error(error.message);
}

export async function renamePlan(
  planId: string,
  name: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("plans")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", planId);
  if (error) throw new Error(error.message);
}
