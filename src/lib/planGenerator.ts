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
  "10k":     { minWeeks: 10, maxWeeks: 16, peakWeeklyKm: 50,  longRunCap: 16, longRunPct: 0.30, taperWeeks: 1, raceDistanceKm: 10 },
  "half":    { minWeeks: 14, maxWeeks: 20, peakWeeklyKm: 65,  longRunCap: 24, longRunPct: 0.32, taperWeeks: 2, raceDistanceKm: 21.1 },
  "marathon": { minWeeks: 18, maxWeeks: 26, peakWeeklyKm: 80, longRunCap: 34, longRunPct: 0.35, taperWeeks: 3, raceDistanceKm: 42.2 },
  "50k":     { minWeeks: 20, maxWeeks: 30, peakWeeklyKm: 110, longRunCap: 45, longRunPct: 0.38, taperWeeks: 3, raceDistanceKm: 50 },
  "100k":    { minWeeks: 24, maxWeeks: 36, peakWeeklyKm: 150, longRunCap: 55, longRunPct: 0.40, taperWeeks: 3, raceDistanceKm: 100 },
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
  const isUltra = goal === "50k" || goal === "100k";
  const isShort = goal === "5k" || goal === "10k";

  if (phase === "Base") return 3;

  if (phase === "Build") {
    if (isUltra) return 6;
    if (isShort) return 4;
    return 5;
  }

  if (phase === "Specific") {
    if (isUltra) return 6;
    if (isShort) return 4;
    return 5;
  }

  if (phase === "Taper") {
    if (weekType === "Winding Down") return 4;
    if (weekType === "Early Taper") return 4;
    return 3;
  }

  return 4; // fallback
}

// --- Day-spacing lookup: indices into MON(0)..SAT(5), SUN(6) reserved for long run ---

const MIDWEEK_DAY_SELECTIONS: Record<number, number[]> = {
  1: [3],                  // THU                        R R R T R R LR
  2: [1, 3],               // TUE, THU                   R T R T R R LR
  3: [0, 2, 4],            // MON, WED, FRI              M R W R F R LR
  4: [1, 2, 3, 5],         // TUE, WED, THU, SAT         R T W T R S LR
  5: [0, 2, 3, 4, 5],      // MON, WED, THU, FRI, SAT    M R W T F S LR
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
  totalWeeks: number,
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

  // Distribute remaining km across midweek days
  const midweekKms = distributeKm(remainingKm, midweekDayIndices.length);

  // Assign run types based on phase
  const isBase = wp.phase === "Base";
  const isBuild = wp.phase === "Build";
  const isSpecific = wp.phase === "Specific";
  const includeStrides = config.options.strides && !isBase;
  const stridesInBase = config.options.strides && isBase && weekIdx >= 2;

  const days: PlanDay[] = DAY_NAMES.map((dayName) => ({ ...R, day: dayName }));

  // Place midweek runs
  midweekDayIndices.forEach((dayIdx, i) => {
    const km = midweekKms[i];
    let desc: string;

    if (i === 0 && config.options.tempo && (isBuild || isSpecific)) {
      desc = tempoRunDesc(km);
    } else if (i === 1 && config.options.elevation && (isBuild || isSpecific) && config.raceType === "trail") {
      desc = hillRunDesc(km, config.targetElevationM ? Math.round(config.targetElevationM * 0.3) : undefined);
    } else if (i === 0 && config.options.surges && isBuild) {
      desc = surgeRunDesc(km);
    } else if (config.options.easy) {
      desc = easyRunDesc(km, (includeStrides || stridesInBase) && i === midweekDayIndices.length - 1);
    } else {
      desc = `${km}km run`;
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

function generateRaceWeek(config: PlanGeneratorConfig, params: GoalParams): PlanDay[] {
  const DAY_NAMES: DayName[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const shakeoutKm = Math.max(3, Math.min(8, Math.round(params.raceDistanceKm * 0.1)));

  return DAY_NAMES.map((day) => {
    if (day === "MON") return { day, km: 0, description: "Rest" };
    if (day === "TUE") return { day, km: shakeoutKm, description: `${shakeoutKm}km easy + strides` };
    if (day === "WED") return { day, km: shakeoutKm, description: `${shakeoutKm}km easy` };
    if (day === "THU") return { day, km: 0, description: "Rest" };
    if (day === "FRI") return { day, km: shakeoutKm, description: `${shakeoutKm}km recovery + strides` };
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
