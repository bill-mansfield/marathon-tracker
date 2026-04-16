# marathon-tracker — AI Context Map

> **Stack:** raw-http | none | react | typescript

> 0 routes | 4 models | 31 components | 8 lib files | 2 env vars | 0 middleware
> **Token savings:** this file is ~2,500 tokens. Without it, AI exploration would cost ~22,700 tokens. **Saves ~20,200 tokens per conversation.**
> **Last scanned:** 2026-04-16 01:56 — re-run after significant changes

---

# Schema

### profiles
- id: uuid (pk)
- display_name: text
- strava_athlete_id: bigint (fk)
- strava_tokens: jsonb

### plans
- id: uuid (pk)
- user_id: uuid (required, fk)
- name: text (required)
- status: text (required)
- goal: text (required)
- race_type: text (required)
- target_elevation_m: integer
- current_weekly_km: numeric (required)
- race_date: date (required)
- volume_increase_pct: numeric (required)
- options: jsonb (required)
- weeks: jsonb (required)

### progress
- id: uuid (pk)
- plan_id: uuid (required, fk)
- day_key: text (required)
- completed: boolean (required)
- rating: smallint (required)
- note: text (required)
- strava_url: text (required)
- strava_activity_id: bigint (fk)
- actual_km: numeric
- description: text
- is_extra: boolean (required)
- deleted: boolean (required)

### example_plans
- id: text (pk)
- name: text (required)
- description: text (required)
- goal: text (required)
- weeks: jsonb (required)

---

# Components

- **App** — `src/App.tsx`
- **AuthGuard** — `src/components/AuthGuard.tsx`
- **DayCell** — props: planDay, progress, onUpdate, compact, onRemove, removeLabel — `src/components/DayCell.tsx`
- **Header** — props: weeks, planName, raceDateStr, progress, colorMode, onToggleColorMode, linkedFileEnabled, supportsLinkedFile, onLinkSaveFile, onExportJson — `src/components/Header.tsx`
- **BuildWeeksLogo** — props: iconSize, onClick — `src/components/Icons.tsx`
- **CheckIcon** — props: size, color — `src/components/Icons.tsx`
- **CheckboxIcon** — props: checked, size — `src/components/Icons.tsx`
- **StarIcon** — props: filled, size, color — `src/components/Icons.tsx`
- **NoteIcon** — props: hasNote, size — `src/components/Icons.tsx`
- **StravaIcon** — props: linked, size — `src/components/Icons.tsx`
- **SunIcon** — props: size — `src/components/Icons.tsx`
- **MoonIcon** — props: size — `src/components/Icons.tsx`
- **PencilIcon** — props: size — `src/components/Icons.tsx`
- **NotePopover** — props: note, onSave — `src/components/NotePopover.tsx`
- **PlanCard** — props: plan, onClick, onDelete, onStatusChange — `src/components/PlanCard.tsx`
- **ProgressChart** — props: weeks, progress, selectedWeek, onSelectWeek, colorMode — `src/components/ProgressChart.tsx`
- **StarRating** — props: rating, onChange — `src/components/StarRating.tsx`
- **StatusBadge** — props: status — `src/components/StatusBadge.tsx`
- **StravaPopover** — props: url, onSave — `src/components/StravaPopover.tsx`
- **WeekCard** — props: week, weekIndex, progress, onUpdate, onAddRun, onRemoveRun, isCurrentWeek — `src/components/WeekCard.tsx`
- **WeekTimeline** — props: weeks, progress, selectedWeek, currentWeek, onSelectWeek — `src/components/WeekTimeline.tsx`
- **AuthProvider** — `src/contexts/AuthContext.tsx`
- **DashboardPage** — `src/pages/DashboardPage.tsx`
- **DemoPage** — `src/pages/DemoPage.tsx`
- **GuestPlanPage** — `src/pages/GuestPlanPage.tsx`
- **LandingPage** — `src/pages/LandingPage.tsx`
- **LoginPage** — `src/pages/LoginPage.tsx`
- **PlanCreatorPage** — `src/pages/PlanCreatorPage.tsx`
- **PlanViewPage** — `src/pages/PlanViewPage.tsx`
- **SignupPage** — `src/pages/SignupPage.tsx`
- **UserSettingsPage** — `src/pages/UserSettingsPage.tsx`

---

# Libraries

- `src/hooks/useAuth.ts` — function useAuth: () => void
- `src/hooks/useColorMode.ts` — function useColorMode: () => void
- `src/hooks/usePlanData.ts` — function usePlanData: (planId) => PlanData
- `src/lib/planGenerator.ts` — function generatePlan: (config) => PlanWeek[], const EXAMPLE_PLANS: { id: string; name: string; description: string; config: PlanGeneratorConfig }[]
- `src/lib/storage.ts`
  - function loadProgress: () => ProgressMap
  - function saveProgress: (progress) => void
  - function supportsLinkedProgressFile: () => boolean
  - function hasLinkedProgressFile: () => Promise<boolean>
  - function loadLinkedProgress: () => Promise<ProgressMap | null>
  - function linkProgressFile: (progress) => Promise<boolean>
  - _...13 more_
- `src/lib/stravaSync.ts`
  - function syncStravaActivities: (plan, currentProgress) => Promise<SyncResult>
  - function getStravaProfile: () => Promise<
  - function disconnectStrava: () => Promise<void>
  - interface SyncResult
- `src/lib/supabaseStorage.ts`
  - function fetchUserPlans: () => Promise<TrainingPlan[]>
  - function createPlan: (plan) => Promise<TrainingPlan>
  - function updatePlanStatus: (planId, status) => Promise<void>
  - function deletePlan: (planId) => Promise<void>
  - function renamePlan: (planId, name) => Promise<void>
  - function importPlanProgress: (planId, progress) => Promise<void>
- `src/lib/utils.ts`
  - function getProgressKey: (weekIndex, day) => string
  - function getExtraRunKey: (weekIndex, day) => string
  - function getExtraRunsForDay: (weekIndex, day, progress) => Array<[string, RunProgress]>
  - function getWeekActualKm: (week, weekIndex, progress) => number
  - function isRestDay: (description, km, isStrength?) => boolean
  - function getRunTotals: (week, weekIndex, progress) => void
  - _...1 more_

---

# Config

## Environment Variables

- `VITE_SUPABASE_ANON_KEY` (has default) — .env.example
- `VITE_SUPABASE_URL` (has default) — .env.example

## Config Files

- `.env.example`
- `tsconfig.json`
- `vite.config.ts`

## Key Dependencies

- @supabase/supabase-js: ^2.103.0
- react: ^19.2.4

---

# Dependency Graph

## Most Imported Files (change these carefully)

- `src/data/types.ts` — imported by **17** files
- `src/theme.ts` — imported by **15** files
- `src/hooks/useAuth.ts` — imported by **9** files
- `src/components/Icons.tsx` — imported by **9** files
- `src/lib/utils.ts` — imported by **8** files
- `src/hooks/useColorMode.ts` — imported by **7** files
- `src/lib/supabase.ts` — imported by **5** files
- `src/lib/supabaseStorage.ts` — imported by **4** files
- `src/lib/storage.ts` — imported by **4** files
- `src/components/Header.tsx` — imported by **3** files
- `src/components/WeekCard.tsx` — imported by **3** files
- `src/components/WeekTimeline.tsx` — imported by **3** files
- `src/components/ProgressChart.tsx` — imported by **3** files
- `src/lib/planGenerator.ts` — imported by **3** files
- `src/contexts/AuthStateContext.ts` — imported by **2** files
- `src/lib/stravaSync.ts` — imported by **2** files
- `src/contexts/AuthContext.tsx` — imported by **1** files
- `src/components/AuthGuard.tsx` — imported by **1** files
- `src/pages/LandingPage.tsx` — imported by **1** files
- `src/pages/LoginPage.tsx` — imported by **1** files

## Import Map (who imports what)

- `src/data/types.ts` ← `src/components/DayCell.tsx`, `src/components/Header.tsx`, `src/components/PlanCard.tsx`, `src/components/ProgressChart.tsx`, `src/components/StatusBadge.tsx` +12 more
- `src/theme.ts` ← `src/components/DayCell.tsx`, `src/components/Header.tsx`, `src/components/PlanCard.tsx`, `src/components/ProgressChart.tsx`, `src/components/StravaPopover.tsx` +10 more
- `src/hooks/useAuth.ts` ← `src/components/AuthGuard.tsx`, `src/components/Header.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/GuestPlanPage.tsx`, `src/pages/LandingPage.tsx` +4 more
- `src/components/Icons.tsx` ← `src/components/DayCell.tsx`, `src/components/Header.tsx`, `src/components/NotePopover.tsx`, `src/components/StarRating.tsx`, `src/components/StravaPopover.tsx` +4 more
- `src/lib/utils.ts` ← `src/components/DayCell.tsx`, `src/components/Header.tsx`, `src/components/ProgressChart.tsx`, `src/hooks/usePlanData.ts`, `src/lib/stravaSync.ts` +3 more
- `src/hooks/useColorMode.ts` ← `src/pages/DashboardPage.tsx`, `src/pages/DemoPage.tsx`, `src/pages/GuestPlanPage.tsx`, `src/pages/LandingPage.tsx`, `src/pages/PlanCreatorPage.tsx` +2 more
- `src/lib/supabase.ts` ← `src/contexts/AuthContext.tsx`, `src/hooks/usePlanData.ts`, `src/lib/stravaSync.ts`, `src/lib/supabaseStorage.ts`, `src/pages/UserSettingsPage.tsx`
- `src/lib/supabaseStorage.ts` ← `src/pages/DashboardPage.tsx`, `src/pages/GuestPlanPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/PlanCreatorPage.tsx`
- `src/lib/storage.ts` ← `src/pages/DashboardPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/PlanCreatorPage.tsx`, `src/pages/PlanViewPage.tsx`
- `src/components/Header.tsx` ← `src/pages/DemoPage.tsx`, `src/pages/GuestPlanPage.tsx`, `src/pages/PlanViewPage.tsx`

---

_Generated by [codesight](https://github.com/Houseofmvps/codesight) — see your codebase clearly_