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
  taperWeeks: number; // minimum taper weeks
  raceDistanceKm: number;
}

const GOAL_PARAMS: Record<GoalDistance, GoalParams> = {
  "5k":      { minWeeks: 8,  maxWeeks: 12, peakWeeklyKm: 30,  longRunCap: 10, taperWeeks: 1, raceDistanceKm: 5 },
  "10k":     { minWeeks: 10, maxWeeks: 16, peakWeeklyKm: 50,  longRunCap: 16, taperWeeks: 1, raceDistanceKm: 10 },
  "half":    { minWeeks: 14, maxWeeks: 20, peakWeeklyKm: 65,  longRunCap: 24, taperWeeks: 2, raceDistanceKm: 21.1 },
  "marathon": { minWeeks: 18, maxWeeks: 26, peakWeeklyKm: 80, longRunCap: 32, taperWeeks: 3, raceDistanceKm: 42.2 },
  "50k":     { minWeeks: 20, maxWeeks: 30, peakWeeklyKm: 100, longRunCap: 40, taperWeeks: 3, raceDistanceKm: 50 },
  "100k":    { minWeeks: 24, maxWeeks: 36, peakWeeklyKm: 120, longRunCap: 50, taperWeeks: 3, raceDistanceKm: 100 },
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
  const baseWeeks = Math.max(3, Math.round(trainingWeeks * 0.4));
  const buildWeeks = Math.max(2, Math.round(trainingWeeks * 0.35));
  const specificWeeks = Math.max(1, trainingWeeks - baseWeeks - buildWeeks);

  // Build weekly volume targets
  const weekPlans: WeekPlan[] = [];
  let currentKm = config.currentWeeklyKm;
  const increaseFactor = 1 + config.volumeIncreasePct / 100;
  let weeksSinceDeload = 0;

  // Helper to add a week
  function addWeek(phase: Phase, weekType: string, isDeload: boolean) {
    if (isDeload && config.options.deloads) {
      currentKm = currentKm * 0.8;
    }
    currentKm = Math.min(currentKm, params.peakWeeklyKm);
    weekPlans.push({ phase, weekType, targetKm: Math.round(currentKm), isDeload });
    if (!isDeload) {
      currentKm *= increaseFactor;
    } else {
      // After deload, resume from pre-deload level
      currentKm = currentKm / 0.8 * increaseFactor * 0.8; // net: slight bump after deload
    }
    weeksSinceDeload = isDeload ? 0 : weeksSinceDeload + 1;
  }

  // Base phase
  for (let i = 0; i < baseWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3 && i > 0;
    if (needsDeload) {
      addWeek("Base", "Cutback", true);
    } else {
      addWeek("Base", i < 2 ? "Base" : "Base Build", false);
    }
  }

  // Build phase
  for (let i = 0; i < buildWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3;
    if (needsDeload) {
      addWeek("Build", "Cutback", true);
    } else {
      addWeek("Build", "Build", false);
    }
  }

  // Specific phase
  for (let i = 0; i < specificWeeks; i++) {
    const needsDeload = config.options.deloads && weeksSinceDeload >= 3;
    if (needsDeload) {
      addWeek("Specific", "Cutback", true);
    } else {
      addWeek("Specific", i === specificWeeks - 1 ? "Peak" : "Specific", false);
    }
  }

  // Taper
  const peakKm = Math.max(...weekPlans.map((w) => w.targetKm));
  for (let i = 0; i < taperWeeks; i++) {
    const taperFraction = 1 - ((i + 1) / (taperWeeks + 1)) * 0.6;
    const taperKm = Math.round(peakKm * taperFraction);
    const label = taperWeeks > 1 && i === 0 ? "Early Taper" : "Taper";
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

  for (let i = 0; i < allWeeks; i++) {
    const wp = weekPlans[i];
    const weeksFromEnd = allWeeks - 1 - i;
    const weekStart = subWeeks(raceDate, weeksFromEnd);
    // Align to Monday
    const monday = addDays(weekStart, -((weekStart.getDay() + 6) % 7));

    const days = generateWeekDays(wp, i, allWeeks, config, params);
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
  params: GoalParams
): PlanDay[] {
  const DAY_NAMES: DayName[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const R: PlanDay = { day: "MON", km: 0, description: "Rest" };
  const targetKm = wp.targetKm;

  // Determine run days based on phase and volume
  let runDayCount: number;
  if (targetKm < 20) runDayCount = 3;
  else if (targetKm < 35) runDayCount = 4;
  else if (targetKm < 55) runDayCount = 5;
  else runDayCount = 6;

  // Race week is special
  if (wp.phase === "Race Week") {
    return generateRaceWeek(config, params);
  }

  // Long run on Sunday (if enabled)
  const longRunEnabled = config.options.longRuns;
  const longRunPct = longRunEnabled ? 0.3 : 0;
  const longRunKm = longRunEnabled
    ? Math.min(
        Math.round(targetKm * longRunPct),
        params.longRunCap,
        // Gradually increase long run — don't go max in base
        Math.round(params.longRunCap * Math.min(1, (weekIdx + 1) / (totalWeeks * 0.7)))
      )
    : 0;

  const remainingKm = targetKm - longRunKm;

  // Determine which days are run days (excluding Sunday long run)
  const midweekRunCount = runDayCount - (longRunEnabled ? 1 : 0);

  // Pick midweek run day slots — prefer TUE, THU, then WED, then MON, SAT, FRI
  const dayPriority = [1, 3, 2, 0, 5, 4]; // TUE, THU, WED, MON, SAT, FRI
  const midweekDayIndices = dayPriority.slice(0, midweekRunCount);

  // Distribute remaining km across midweek days
  const midweekKms = distributeKm(remainingKm, midweekRunCount);

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
      desc = easyRunDesc(km, (includeStrides || stridesInBase) && i === midweekRunCount - 1);
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
  const shakeoutKm = Math.min(4, Math.round(params.raceDistanceKm * 0.1));

  return DAY_NAMES.map((day) => {
    if (day === "MON") return { day, km: 0, description: "Rest" };
    if (day === "TUE") return { day, km: shakeoutKm, description: `${shakeoutKm}km easy shakeout` };
    if (day === "WED") return { day, km: 0, description: "Rest" };
    if (day === "THU") return { day, km: shakeoutKm, description: `${shakeoutKm}km easy + strides` };
    if (day === "FRI") return { day, km: 0, description: "Rest or light shakeout" };
    if (day === "SAT") {
      return {
        day,
        km: params.raceDistanceKm,
        description: `RACE DAY — ${config.goal.toUpperCase()}`,
      };
    }
    // SUN
    return { day, km: 0, description: "Rest / recovery" };
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
  if (wp.isDeload) return "Cutback week — recover and absorb training";
  if (wp.phase === "Race Week") return `Race week! Taper and prepare for ${config.goal.toUpperCase()}`;

  if (wp.phase === "Base") {
    if (weekIdx === 0) return "First week — keep it easy and build the habit";
    return "Aerobic base building";
  }
  if (wp.phase === "Build") return "Introducing structured work";
  if (wp.phase === "Specific") return "Race-specific training";
  if (wp.phase === "Taper") return "Reduce volume, maintain intensity";
  return "";
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
