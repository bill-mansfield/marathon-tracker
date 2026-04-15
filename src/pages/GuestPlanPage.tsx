import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, HStack, Text, Flex } from "@chakra-ui/react";
import { parseISO, isWithinInterval, addDays } from "date-fns";
import type { PlanWeek, RunProgress } from "../data/types";
import { getExtraRunKey, DEFAULT_PROGRESS } from "../lib/utils";
import {
  loadGuestPlan,
  saveGuestProgress,
  loadGuestProgress,
  clearGuestPlan,
  clearGuestProgress,
} from "../lib/storage";
import { generatePlan } from "../lib/planGenerator";
import { createPlan, importPlanProgress } from "../lib/supabaseStorage";
import { Header } from "../components/Header";
import { WeekCard } from "../components/WeekCard";
import { WeekTimeline } from "../components/WeekTimeline";
import { ProgressChart } from "../components/ProgressChart";
import { useColorMode } from "../hooks/useColorMode";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../theme";

function getCurrentWeekIndex(weeks: PlanWeek[]): number {
  const now = new Date();
  for (let i = 0; i < weeks.length; i++) {
    const start = parseISO(weeks[i].weekStart);
    const end = addDays(start, 6);
    if (isWithinInterval(now, { start, end })) return i;
  }
  return 0;
}

export function GuestPlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colorMode, toggle } = useColorMode();

  const draft = useMemo(() => loadGuestPlan(), []);
  const weeks = useMemo(() => {
    if (!draft) return [];
    try {
      const { name: _name, ...config } = draft;
      return generatePlan(config);
    } catch {
      return [];
    }
  }, [draft]);

  const currentWeek = getCurrentWeekIndex(weeks);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [progress, setProgress] = useState(loadGuestProgress);
  const [saving, setSaving] = useState(false);

  const updateProgress = useCallback((key: string, patch: Partial<RunProgress>) => {
    setProgress((prev) => {
      const next = { ...prev, [key]: { ...DEFAULT_PROGRESS, ...(prev[key] ?? {}), ...patch } };
      saveGuestProgress(next);
      return next;
    });
  }, []);

  const addRun = useCallback(
    (day: PlanWeek["days"][number]["day"]) => {
      const key = getExtraRunKey(selectedWeek, day);
      setProgress((prev) => {
        const next = { ...prev, [key]: { ...DEFAULT_PROGRESS, isExtra: true, description: "Extra run", actualKm: 5 } };
        saveGuestProgress(next);
        return next;
      });
    },
    [selectedWeek]
  );

  const removeRun = useCallback((key: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[key];
      saveGuestProgress(next);
      return next;
    });
  }, []);

  const handleSaveToAccount = useCallback(async () => {
    if (!draft || !user) {
      navigate("/signup");
      return;
    }
    setSaving(true);
    try {
      const { name, ...config } = draft;
      const plan = await createPlan({
        name,
        goal: config.goal,
        race_type: config.raceType,
        target_elevation_m: config.raceType === "trail" ? (config.targetElevationM ?? null) : null,
        current_weekly_km: config.currentWeeklyKm,
        race_date: config.raceDate,
        volume_increase_pct: config.volumeIncreasePct,
        options: config.options,
        weeks,
        status: "in_progress",
      });
      await importPlanProgress(plan.id, progress);
      clearGuestPlan();
      clearGuestProgress();
      navigate(`/plans/${plan.id}`);
    } catch {
      setSaving(false);
    }
  }, [draft, user, weeks, progress, navigate]);

  // No draft found — send back to creator
  if (!draft || weeks.length === 0) {
    return (
      <Box bg="bg.page" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center">
          <Text color="text.muted" mb={4}>No plan found — create one first.</Text>
          <Box
            as="button"
            onClick={() => navigate("/plans/new")}
            fontSize="14px"
            fontWeight="600"
            color="white"
            bg={COLORS.emerald}
            px={4}
            py={2}
            borderRadius="md"
            border="none"
            cursor="pointer"
          >
            Create a plan
          </Box>
        </Box>
      </Box>
    );
  }

  const week = weeks[selectedWeek];

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      {/* Save banner */}
      <Box
        bg={COLORS.emerald}
        color="white"
        px={{ base: 3, md: 6 }}
        py="10px"
      >
        <Flex justify="space-between" align="center" maxW="1100px" mx="auto" gap={4} flexWrap="wrap">
          <Text fontSize="13px" fontWeight="600">
            {user
              ? "Save this plan to your account to track it across devices."
              : "Create a free account to save your plan and track progress."}
          </Text>
          <Box
            as="button"
            onClick={() => void handleSaveToAccount()}
            fontSize="13px"
            fontWeight="700"
            px={4}
            py="6px"
            borderRadius="md"
            border="2px solid white"
            bg="transparent"
            color="white"
            cursor={saving ? "wait" : "pointer"}
            opacity={saving ? 0.7 : 1}
            whiteSpace="nowrap"
            _hover={{ bg: "white", color: COLORS.emerald }}
          >
            {saving ? "Saving..." : user ? "Save to account" : "Sign up free"}
          </Box>
        </Flex>
      </Box>

      <Box maxW="1100px" mx="auto" px={{ base: 2, md: 4 }} pb={8}>
        <Header
          weeks={weeks}
          planName={draft.name}
          raceDate={draft.raceDate}
          progress={progress}
          colorMode={colorMode}
          onToggleColorMode={toggle}
          linkedFileEnabled={false}
          supportsLinkedFile={false}
          onLinkSaveFile={() => {}}
          onExportJson={() => {}}
          onBack={() => navigate("/plans/new")}
        />

        <ProgressChart
          weeks={weeks}
          progress={progress}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          colorMode={colorMode}
        />

        <WeekTimeline
          weeks={weeks}
          progress={progress}
          selectedWeek={selectedWeek}
          currentWeek={currentWeek}
          onSelectWeek={setSelectedWeek}
        />

        <HStack justify="space-between" mb={3} px={1}>
          <Box
            as="button"
            onClick={() => setSelectedWeek((w) => Math.max(0, w - 1))}
            aria-disabled={selectedWeek === 0}
            opacity={selectedWeek === 0 ? 0.3 : 1}
            cursor={selectedWeek === 0 ? "default" : "pointer"}
            fontSize="13px"
            fontWeight="600"
            color="text.muted"
            background="none"
            border="none"
            _hover={{ color: "text.primary" }}
          >
            &larr; Prev week
          </Box>
          <Text fontSize="12px" color="text.faint">
            {selectedWeek + 1} of {weeks.length}
          </Text>
          <Box
            as="button"
            onClick={() => setSelectedWeek((w) => Math.min(weeks.length - 1, w + 1))}
            aria-disabled={selectedWeek === weeks.length - 1}
            opacity={selectedWeek === weeks.length - 1 ? 0.3 : 1}
            cursor={selectedWeek === weeks.length - 1 ? "default" : "pointer"}
            fontSize="13px"
            fontWeight="600"
            color="text.muted"
            background="none"
            border="none"
            _hover={{ color: "text.primary" }}
          >
            Next week &rarr;
          </Box>
        </HStack>

        <WeekCard
          week={week}
          weekIndex={selectedWeek}
          progress={progress}
          onUpdate={updateProgress}
          onAddRun={addRun}
          onRemoveRun={removeRun}
          isCurrentWeek={selectedWeek === currentWeek}
        />
      </Box>
    </Box>
  );
}
