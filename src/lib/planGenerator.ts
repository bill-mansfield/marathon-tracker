import { format, subWeeks, addDays } from "date-fns";
import type {
  DayName,
  PlanDay,
  PlanWeek,
  PlanGeneratorConfig,
  GoalDistance,
} from "../data/types";

// --- Goal-specific parameters ---

interface GoalParams {
  minWeeks: number;
  maxWeeks: number;
  peakWeeklyKm: number;
  longRunCap: number; // max long run in km
  longRunPct: number; // target long run as fraction of weekly volume
  taperWeeks: number; // minimum taper weeks
  raceDistanceKm: number;
}

const GOAL_PARAMS: Record<GoalDistance, GoalParams> = {
  "5k":      { minWeeks: 8,  maxWeeks: 12, peakWeeklyKm: 30,  longRunCap: 10, longRunPct: 0.30, taperWeeks: 1, raceDistanceKm: 5 },
  "10k":     { minWeeks: 10, maxWeeks: 16, peakWeeklyKm: 40,  longRunCap: 16, longRunPct: 0.35, taperWeeks: 1, raceDistanceKm: 10 },
  "half":    { minWeeks: 14, maxWeeks: 20, peakWeeklyKm: 50,  longRunCap: 24, longRunPct: 0.44, taperWeeks: 2, raceDistanceKm: 21.1 },
  "marathon": { minWeeks: 18, maxWeeks: 26, peakWeeklyKm: 58, longRunCap: 34, longRunPct: 0.48, taperWeeks: 3, raceDistanceKm: 42.2 },
  "50k":     { minWeeks: 20, maxWeeks: 30, peakWeeklyKm: 75,  longRunCap: 45, longRunPct: 0.48, taperWeeks: 3, raceDistanceKm: 50 },
  "100k":    { minWeeks: 24, maxWeeks: 36, peakWeeklyKm: 90,  longRunCap: 55, longRunPct: 0.50, taperWeeks: 3, raceDistanceKm: 100 },
};

// --- Session role constants (derived from reference program analysis) ---

// Km for the constant "quality" session (WED slot) — stays ~constant throughout
const QUALITY_SESSION_KM: Record<GoalDistance, number> = {
  "5k": 4, "10k": 5, "half": 6, "marathon": 6, "50k": 8, "100k": 10,
};

// Km for the short "recovery" run (SAT slot, before SUN long run)
const RECOVERY_SESSION_KM: Record<GoalDistance, number> = {
  "5k": 3, "10k": 4, "half": 5, "marathon": 5, "50k": 6, "100k": 8,
};

// Starting km for the "decreasing easy run" (TUE/MON slot) — drops linearly to 1km by race
// Both marathon and 100km reference programs start this at 11km
const DECREASING_RUN_START: Record<GoalDistance, number> = {
  "5k": 5, "10k": 6, "half": 8, "marathon": 11, "50k": 11, "100k": 12,
};

// --- Phase definitions ---

type Phase = "Base" | "Build" | "Specific" | "Taper" | "Race Week";

interface WeekPlan {
  phase: Phase;
  weekType: string;
  targetKm: number;
  isDeload: boolean;
}

// --- Description templates ---

function easyRunDesc(km: number, includeStrides: boolean): string {
  const base = `${km}km Z2 easy`;
  return includeStrides ? `${base} + strides` : base;
}

function tempoRunDesc(km: number): string {
  const tempoMins = Math.max(4, Math.min(12, Math.round(km * 1.2)));
  return `${km}km with ${tempoMins}min tempo @80%`;
}

function hillRunDesc(km: number, elevationM?: number): string {
  const elev = elevationM ? ` (${elevationM}m gain)` : "";
  return `${km}km hill repeats${elev}`;
}

function longRunDesc(km: number, isTrail: boolean, elevationM?: number): string {
  let desc = `${km}km long run`;
  if (isTrail && elevationM) desc += ` (~${elevationM}m elev)`;
  return desc;
}

function surgeRunDesc(km: number): string {
  return `${km}km Z2 easy with surges`;
}

function strengthDesc(): string {
  return "Strength training (30-45min)";
}

// --- Phase context for passing phase boundaries into day generation ---

interface PhaseContext {
  baseWeeks: number;
  buildWeeks: number;
  specificWeeks: number;
  taperWeeks: number;
}

// --- Phase-based run day count ---

function getRunDayCount(phase: Phase, weekType: string, goal: GoalDistance): number {
  const isShort = goal === "5k" || goal === "10k";

  if (phase === "Base") return 3;

  if (phase === "Build") {
    if (isShort) return 4;
    return 5; // max 5 runs (2 rest days: MON after long, FRI before long)
  }

  if (phase === "Specific") {
    if (isShort) return 4;
    return 5;
  }

  if (phase === "Taper") {
    const isShortGoal = goal === "5k" || goal === "10k";
    if (isShortGoal) {
      return weekType === "Taper" ? 3 : 4;
    }
    // marathon+: maintain frequency through taper — only distances drop
    if (weekType === "Winding Down") return 5;
    if (weekType === "Early Taper") return 4;
    return 4;
  }

  return 4; // fallback
}

// --- Day-spacing lookup: indices into MON(0)..SAT(5), SUN(6) reserved for long run ---

const MIDWEEK_DAY_SELECTIONS: Record<number, number[]> = {
  1: [3],                  // THU                        R R R T R R LR
  2: [1, 3],               // TUE, THU                   R T R T R R LR  (base: 3 total)
  3: [1, 2, 5],            // TUE, WED, SAT              R T W R R S LR  (taper: 4 total)
  4: [1, 2, 3, 5],         // TUE, WED, THU, SAT         R T W T R S LR  (build/specific: 5 total)
  5: [0, 2, 3, 4, 5],      // MON, WED, THU, FRI, SAT    M R W T F S LR  (ultra: 6 total)
};

// --- Main generator ---

export function generatePlan(config: PlanGeneratorConfig): PlanWeek[] {
  const params = GOAL_PARAMS[config.goal];
  const raceDate = new Date(config.raceDate);
  const now = new Date();

  // Calculate available weeks
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  let totalWeeks = Math.floor((raceDate.getTime() - now.getTime()) / msPerWeek);
  totalWeeks = Math.max(params.minWeeks, Math.min(params.maxWeeks, totalWeeks));

  // Allocate phases
  const taperWeeks = params.taperWeeks;
  const raceWeek = 1;
  const trainingWeeks = totalWeeks - taperWeeks - raceWeek;

  // Base gets more time for longer plans
  let basePct: number;
  if (totalWeeks <= 14) basePct = 0.35;
  else if (totalWeeks <= 22) basePct = 0.45;
  else basePct = 0.50;

  const baseWeeks = Math.max(3, Math.round(trainingWeeks * basePct));
  const specificWeeks = Math.max(2, Math.min(5, Math.round(trainingWeeks * 0.15)));
  const buildWeeks = Math.max(2, trainingWeeks - baseWeeks - specificWeeks);

  // Build weekly volume targets
  const weekPlans: WeekPlan[] = [];
  let currentKm = config.currentWeeklyKm;
  const increaseFactor = 1 + config.volumeIncreasePct / 100;
  let weeksSinceDeload = 0;

  // Helper to add a week
  function addWeek(phase: Phase, weekType: string, isDeload: boolean) {
    const preDeloadKm = currentKm;
    if (isDeload && config.options.deloads) {
      currentKm = currentKm * 0.8;
    }
    currentKm = Math.min(currentKm, params.peakWeeklyKm);
    weekPlans.push({ phase, weekType, targetKm: Math.round(currentKm), isDeload });
    if (!isDeload) {
      currentKm *= increaseFactor;
    } else {
      // Resume progression from the pre-deload level — deload only affects that one week
      currentKm = preDeloadKm * increaseFactor;
    }
    weeksSinceDeload = isDeload ? 0 : weeksSinceDeload + 1;
  }

  // Base phase
  for (let i = 0; i < baseWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3 && i > 0;
    if (needsDeload) {
      addWeek("Base", "Cutback", true);
    } else if (i < 2) {
      addWeek("Base", "Base", false);
    } else if (i === 2) {
      addWeek("Base", "Base + Strides", false);
    } else if (i === baseWeeks - 1) {
      addWeek("Base", "Transition", false);
    } else {
      addWeek("Base", "Base Build", false);
    }
  }

  // Build phase
  for (let i = 0; i < buildWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3;
    if (needsDeload) {
      addWeek("Build", "Absorption", true);
    } else {
      addWeek("Build", "General Build", false);
    }
  }

  // Specific phase
  for (let i = 0; i < specificWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3;
    if (needsDeload) {
      addWeek("Specific", "Absorption", true);
    } else if (i === specificWeeks - 1) {
      addWeek("Specific", "Peak", false);
    } else {
      addWeek("Specific", "Specific", false);
    }
  }

  // Taper
  const peakKm = Math.max(...weekPlans.map((w) => w.targetKm));
  for (let i = 0; i < taperWeeks; i++) {
    const taperFraction = 1 - ((i + 1) / (taperWeeks + 1)) * 0.6;
    const taperKm = Math.round(peakKm * taperFraction);
    let label: string;
    if (taperWeeks >= 3 && i === 0) label = "Winding Down";
    else if (i < taperWeeks - 1) label = "Early Taper";
    else label = "Taper";
    weekPlans.push({ phase: "Taper", weekType: label, targetKm: taperKm, isDeload: false });
  }

  // Race week
  weekPlans.push({
    phase: "Race Week",
    weekType: "Race Week",
    targetKm: Math.round(peakKm * 0.3 + params.raceDistanceKm),
    isDeload: false,
  });

  // Generate PlanWeek[] with dates working backward from race date
  const allWeeks = weekPlans.length;
  const weeks: PlanWeek[] = [];
  const phaseContext: PhaseContext = { baseWeeks, buildWeeks, specificWeeks, taperWeeks };

  for (let i = 0; i < allWeeks; i++) {
    const wp = weekPlans[i];
    const weeksFromEnd = allWeeks - 1 - i;
    const weekStart = subWeeks(raceDate, weeksFromEnd);
    // Align to Monday
    const monday = addDays(weekStart, -((weekStart.getDay() + 6) % 7));

    const days = generateWeekDays(wp, i, allWeeks, config, params, phaseContext);
    const totalKm = days.reduce((s, d) => s + d.km, 0);

    weeks.push({
      weekStart: format(monday, "yyyy-MM-dd"),
      weekType: wp.weekType,
      days,
      totalKm,
      notes: getWeekNotes(wp, i, allWeeks, config),
      longRunPlan: "",
    });
  }

  return weeks;
}

function generateWeekDays(
  wp: WeekPlan,
  weekIdx: number,
  _totalWeeks: number,
  config: PlanGeneratorConfig,
  params: GoalParams,
  phaseContext: PhaseContext
): PlanDay[] {
  const DAY_NAMES: DayName[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const R: PlanDay = { day: "MON", km: 0, description: "Rest" };
  const targetKm = wp.targetKm;

  // Race week is special
  if (wp.phase === "Race Week") {
    return generateRaceWeek(config, params);
  }

  // Phase-based run day count
  const runDayCount = getRunDayCount(wp.phase, wp.weekType, config.goal);

  // Long run on Sunday (if enabled) with phase-aware progression
  const longRunEnabled = config.options.longRuns;
  let longRunKm = 0;
  if (longRunEnabled) {
    const volumeBasedLongRun = Math.round(targetKm * params.longRunPct);

    // Progressive cap based on phase position
    const { baseWeeks, buildWeeks, specificWeeks } = phaseContext;
    let progressiveCap: number;
    if (wp.phase === "Base") {
      const baseProgress = baseWeeks > 1 ? weekIdx / (baseWeeks - 1) : 1;
      progressiveCap = params.longRunCap * (0.40 + 0.15 * baseProgress); // 40% to 55%
    } else if (wp.phase === "Build") {
      const buildStart = baseWeeks;
      const buildProgress = buildWeeks > 1 ? (weekIdx - buildStart) / (buildWeeks - 1) : 1;
      progressiveCap = params.longRunCap * (0.55 + 0.25 * buildProgress); // 55% to 80%
    } else if (wp.phase === "Taper") {
      const taperStart = baseWeeks + buildWeeks + specificWeeks;
      const taperProgress = phaseContext.taperWeeks > 1
        ? (weekIdx - taperStart) / (phaseContext.taperWeeks - 1)
        : 1;
      progressiveCap = params.longRunCap * (0.80 - 0.30 * taperProgress); // 80% down to 50%
    } else {
      // Specific/Peak — full cap
      progressiveCap = params.longRunCap;
    }

    longRunKm = Math.min(volumeBasedLongRun, Math.round(progressiveCap));
  }

  const remainingKm = targetKm - longRunKm;

  // Pick midweek run day slots using spacing lookup
  const midweekRunCount = runDayCount - (longRunEnabled ? 1 : 0);
  const clampedCount = Math.max(1, Math.min(5, midweekRunCount));
  const midweekDayIndices = MIDWEEK_DAY_SELECTIONS[clampedCount] || [1, 3];

  // Assign km to midweek slots using session roles
  const midweekKms = assignSessionKm(
    remainingKm, midweekDayIndices.length, wp.phase, config.goal, weekIdx, phaseContext
  );

  // Session role semantics (matches MIDWEEK_DAY_SELECTIONS slot order):
  //   slot 0 = DECREASING easy run (TUE/MON)
  //   slot 1 = QUALITY session (WED)        — only when slotCount >= 3
  //   slot 2 = MODERATE/BIG run (THU)       — only when slotCount >= 4
  //   last   = RECOVERY run (SAT)           — only when slotCount >= 4
  const lastSlot = midweekDayIndices.length - 1;

  const isBase = wp.phase === "Base";
  const isBuild = wp.phase === "Build";
  const isSpecific = wp.phase === "Specific";
  const isTaper = wp.phase === "Taper";
  const includeStrides = config.options.strides && !isBase;
  const stridesInBase = config.options.strides && isBase && weekIdx >= 2;

  const days: PlanDay[] = DAY_NAMES.map((dayName) => ({ ...R, day: dayName }));

  // Place midweek runs
  midweekDayIndices.forEach((dayIdx, i) => {
    const km = midweekKms[i];
    let desc: string;
    const slotCount = midweekDayIndices.length;

    if (isBase || slotCount <= 2) {
      // Base phase: all easy
      desc = config.options.easy
        ? easyRunDesc(km, stridesInBase && i === lastSlot)
        : `${km}km run`;
    } else if (i === 0) {
      // Slot 0: DECREASING easy run (TUE/MON)
      desc = config.options.easy
        ? easyRunDesc(km, false)
        : `${km}km easy`;
    } else if (i === 1) {
      // Slot 1: QUALITY session (WED)
      if (config.options.tempo && (isBuild || isSpecific)) {
        desc = tempoRunDesc(km);
      } else if (config.options.elevation && config.raceType === "trail" && (isBuild || isSpecific)) {
        desc = hillRunDesc(km, config.targetElevationM ? Math.round(config.targetElevationM * 0.3) : undefined);
      } else {
        desc = config.options.easy ? easyRunDesc(km, includeStrides) : `${km}km run`;
      }
    } else if (i === lastSlot && slotCount >= 4) {
      // Last slot: RECOVERY run (SAT)
      desc = config.options.easy ? easyRunDesc(km, false) : `${km}km recovery`;
    } else {
      // Middle slots: MODERATE/BIG run (THU, or FRI for ultras)
      if (config.options.surges && (isBuild || isSpecific)) {
        desc = surgeRunDesc(km);
      } else if (config.options.elevation && config.raceType === "trail" && (isBuild || isSpecific)) {
        desc = hillRunDesc(km, config.targetElevationM ? Math.round(config.targetElevationM * 0.4) : undefined);
      } else if (isTaper) {
        desc = config.options.easy ? easyRunDesc(km, includeStrides) : `${km}km easy`;
      } else {
        desc = config.options.easy ? easyRunDesc(km, false) : `${km}km run`;
      }
    }

    days[dayIdx] = { day: DAY_NAMES[dayIdx], km, description: desc };
  });

  // Place long run on Sunday
  if (longRunEnabled && longRunKm > 0) {
    days[6] = {
      day: "SUN",
      km: longRunKm,
      description: longRunDesc(
        longRunKm,
        config.raceType === "trail",
        config.options.elevation && config.raceType === "trail" && (isBuild || isSpecific)
          ? Math.round((config.targetElevationM ?? 500) * longRunKm / params.raceDistanceKm)
          : undefined
      ),
    };
  }

  // Add strength training note on a rest day if enabled
  if (config.options.strength) {
    const restDays = days.filter((d) => d.km === 0 && d.day !== "SUN");
    if (restDays.length > 0) {
      const strengthDay = restDays[0];
      const idx = DAY_NAMES.indexOf(strengthDay.day);
      days[idx] = { day: strengthDay.day, km: 0, description: strengthDesc() };
    }
  }

  return days;
}

// Goal-specific race week shakeout distances (from reference program analysis)
// Marathon reference: TUE=8km easy, WED=8km easy, FRI=6km recovery
const RACE_WEEK_SHAKEOUTS: Record<GoalDistance, { tue: number; wed: number; fri: number }> = {
  "5k":      { tue: 3, wed: 3, fri: 3 },
  "10k":     { tue: 5, wed: 4, fri: 4 },
  "half":    { tue: 6, wed: 5, fri: 5 },
  "marathon":{ tue: 8, wed: 8, fri: 6 },
  "50k":     { tue: 8, wed: 8, fri: 6 },
  "100k":    { tue: 12, wed: 6, fri: 6 },
};

function generateRaceWeek(config: PlanGeneratorConfig, params: GoalParams): PlanDay[] {
  const DAY_NAMES: DayName[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const shakeouts = RACE_WEEK_SHAKEOUTS[config.goal];

  return DAY_NAMES.map((day) => {
    if (day === "MON") return { day, km: 0, description: "Rest" };
    if (day === "TUE") return { day, km: shakeouts.tue, description: `${shakeouts.tue}km easy + strides` };
    if (day === "WED") return { day, km: shakeouts.wed, description: `${shakeouts.wed}km easy` };
    if (day === "THU") return { day, km: 0, description: "Rest" };
    if (day === "FRI") return { day, km: shakeouts.fri, description: `${shakeouts.fri}km recovery + strides` };
    if (day === "SAT") return { day, km: 0, description: "Rest or 3km shakeout" };
    // SUN — Race day
    return {
      day,
      km: params.raceDistanceKm,
      description: `RACE DAY — ${config.goal.toUpperCase()}`,
    };
  });
}

function distributeKm(totalKm: number, count: number): number[] {
  if (count === 0) return [];
  const base = Math.round(totalKm / count);
  const result = Array(count).fill(base);
  // Adjust first element for rounding
  const sum = result.reduce((a: number, b: number) => a + b, 0);
  result[0] += totalKm - sum;
  return result;
}

/**
 * Assigns km to midweek run slots using session roles derived from reference programs.
 *
 * Slot ordering matches MIDWEEK_DAY_SELECTIONS:
 *   2 slots [TUE,THU]         → [easy, easy]            simple 40/60 split
 *   3 slots [TUE,WED,SAT]     → [decreasing, quality, moderate]
 *   4 slots [TUE,WED,THU,SAT] → [decreasing, quality, moderate, recovery]
 *   5 slots [MON,WED,THU,FRI,SAT] → [decreasing, quality, big, moderate, recovery]
 *
 * The "decreasing" slot starts at DECREASING_RUN_START[goal] and drops linearly
 * to 1km by end of the build+specific+taper block — matching the -1km/week
 * pattern observed in the marathon and 100km reference programs.
 */
function assignSessionKm(
  remainingKm: number,
  slotCount: number,
  phase: Phase,
  goal: GoalDistance,
  weekIdx: number,
  phaseContext: PhaseContext
): number[] {
  if (slotCount === 0) return [];
  if (slotCount === 1) return [remainingKm];

  // Base phase or 2-slot weeks: simple proportional split
  if (phase === "Base" || slotCount === 2) {
    const a = Math.max(3, Math.round(remainingKm * 0.4));
    return slotCount === 2
      ? [a, Math.max(3, remainingKm - a)]
      : distributeKm(remainingKm, slotCount);
  }

  // Build/Specific/Taper: session-role assignment
  // Compute how far through the build→taper block we are (0=start of build, 1=end of taper)
  const buildStart = phaseContext.baseWeeks;
  const totalBuildToEnd = phaseContext.buildWeeks + phaseContext.specificWeeks + phaseContext.taperWeeks;
  const weeksSinceBuild = Math.max(0, weekIdx - buildStart);
  const progress = totalBuildToEnd > 1 ? Math.min(1, weeksSinceBuild / (totalBuildToEnd - 1)) : 0;

  // Slot 0: decreasing easy run — starts high, falls to 1km by end of taper
  const decreasingKm = Math.max(1, Math.round(DECREASING_RUN_START[goal] * (1 - progress)));
  const qualityKm = QUALITY_SESSION_KM[goal];
  const leftover = Math.max(0, remainingKm - decreasingKm - qualityKm);

  if (slotCount === 3) {
    // [decreasing, quality, moderate]
    return [decreasingKm, qualityKm, Math.max(3, leftover)];
  }

  if (slotCount === 4) {
    // [decreasing, quality, moderate, recovery]
    const recoveryKm = Math.min(RECOVERY_SESSION_KM[goal], Math.max(3, Math.round(leftover * 0.30)));
    const moderateKm = Math.max(3, leftover - recoveryKm);
    return [decreasingKm, qualityKm, moderateKm, recoveryKm];
  }

  if (slotCount === 5) {
    // [decreasing, quality, bigSession, moderate, recovery] for ultras
    const recoveryKm = Math.min(RECOVERY_SESSION_KM[goal], Math.max(3, Math.round(leftover * 0.15)));
    const moderateKm = Math.min(qualityKm + 2, Math.max(3, Math.round(leftover * 0.25)));
    const bigKm = Math.max(3, leftover - recoveryKm - moderateKm);
    return [decreasingKm, qualityKm, bigKm, moderateKm, recoveryKm];
  }

  return distributeKm(remainingKm, slotCount); // fallback
}

function getWeekNotes(
  wp: WeekPlan,
  weekIdx: number,
  _totalWeeks: number,
  config: PlanGeneratorConfig
): string {
  if (wp.phase === "Race Week") return `Race week! Taper and prepare for ${config.goal.toUpperCase()}`;

  switch (wp.weekType) {
    case "Cutback": return "Cutback week — recover and absorb training";
    case "Absorption": return "Recovery week — absorb recent training";
    case "Base": return weekIdx === 0 ? "First week — keep it easy and build the habit" : "Aerobic base building — all easy Z2";
    case "Base + Strides": return "Introducing strides at the end of easy runs";
    case "Base Build": return "Building aerobic base with gradual volume increase";
    case "Transition": return "Transitioning from base to structured training";
    case "General Build": return "Introducing structured work — tempo and quality sessions";
    case "Specific": return "Race-specific training";
    case "Peak": return "Peak training week — biggest volume";
    case "Winding Down": return "Beginning to reduce volume";
    case "Early Taper": return "Reducing volume, maintaining some intensity";
    case "Taper": return "Final taper — stay fresh for race day";
    default: return "";
  }
}

// --- Example plan configs ---

export const EXAMPLE_PLANS: { id: string; name: string; description: string; config: PlanGeneratorConfig }[] = [
  {
    id: "couch-to-5k",
    name: "Couch to 5K",
    description: "A gentle 10-week introduction to running. Perfect if you're just starting out.",
    config: {
      goal: "5k",
      raceType: "flat",
      currentWeeklyKm: 5,
      raceDate: format(addDays(new Date(), 10 * 7), "yyyy-MM-dd"),
      volumeIncreasePct: 10,
      options: {
        deloads: true,
        strides: false,
        surges: false,
        elevation: false,
        longRuns: true,
        tempo: false,
        easy: true,
        strength: false,
      },
    },
  },
  {
    id: "half-marathon",
    name: "Half Marathon Trainer",
    description: "A 16-week plan building to 21.1km. Includes tempo work, long runs, and deload weeks.",
    config: {
      goal: "half",
      raceType: "flat",
      currentWeeklyKm: 15,
      raceDate: format(addDays(new Date(), 16 * 7), "yyyy-MM-dd"),
      volumeIncreasePct: 8,
      options: {
        deloads: true,
        strides: true,
        surges: true,
        elevation: false,
        longRuns: true,
        tempo: true,
        easy: true,
        strength: true,
      },
    },
  },
  {
    id: "marathon",
    name: "Marathon Trainer",
    description: "A 24-week marathon plan with full periodization. Base, build, specific, and taper phases.",
    config: {
      goal: "marathon",
      raceType: "flat",
      currentWeeklyKm: 20,
      raceDate: format(addDays(new Date(), 24 * 7), "yyyy-MM-dd"),
      volumeIncreasePct: 8,
      options: {
        deloads: true,
        strides: true,
        surges: true,
        elevation: false,
        longRuns: true,
        tempo: true,
        easy: true,
        strength: true,
      },
    },
  },
];
