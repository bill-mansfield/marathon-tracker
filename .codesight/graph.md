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
