import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, HStack, Text } from "@chakra-ui/react";
import { parseISO, isWithinInterval, addDays } from "date-fns";
import type { PlanWeek } from "../data/types";
import { getExtraRunKey, DEFAULT_PROGRESS } from "../lib/utils";
import { exportPlanJson } from "../lib/storage";
import { usePlanData } from "../hooks/usePlanData";
import { Header } from "../components/Header";
import { WeekCard } from "../components/WeekCard";
import { WeekTimeline } from "../components/WeekTimeline";
import { ProgressChart } from "../components/ProgressChart";
import { useColorMode } from "../hooks/useColorMode";
import { getStravaProfile, syncStravaActivities } from "../lib/stravaSync";

function getCurrentWeekIndex(weeks: PlanWeek[]): number {
  const now = new Date();
  for (let i = 0; i < weeks.length; i++) {
    const start = parseISO(weeks[i].weekStart);
    const end = addDays(start, 6);
    if (isWithinInterval(now, { start, end })) return i;
  }
  return 0;
}

export function PlanViewPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { colorMode, toggle } = useColorMode();
  const { plan, weeks, progress, loading, error, updateProgress } = usePlanData(planId!);

  const currentWeek = getCurrentWeekIndex(weeks);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncingStrava, setSyncingStrava] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    void getStravaProfile().then(({ connected }) => setStravaConnected(connected));
  }, []);

  const handleSyncStrava = useCallback(async () => {
    if (!plan) return;
    setSyncingStrava(true);
    setSyncMessage(null);
    try {
      const { patch, count, extrasAdded } = await syncStravaActivities(plan, progress);
      for (const [key, value] of Object.entries(patch)) {
        if (value) updateProgress(key, value);
      }
      const total = count + extrasAdded;
      let msg = "No new runs to sync";
      if (total > 0) {
        const parts = [];
        if (count > 0) parts.push(`${count} planned run${count === 1 ? "" : "s"}`);
        if (extrasAdded > 0) parts.push(`${extrasAdded} extra${extrasAdded === 1 ? "" : "s"}`);
        msg = `Synced ${parts.join(" + ")} from Strava`;
      }
      setSyncMessage(msg);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingStrava(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  }, [plan, progress, updateProgress]);

  const addRun = useCallback(
    (day: PlanWeek["days"][number]["day"]) => {
      const key = getExtraRunKey(selectedWeek, day);
      updateProgress(key, {
        ...DEFAULT_PROGRESS,
        isExtra: true,
        description: "Extra run",
        actualKm: 5,
      });
    },
    [selectedWeek, updateProgress]
  );

  const removeRun = useCallback(
    (key: string) => {
      updateProgress(key, { deleted: true });
    },
    [updateProgress]
  );

  const handleExportJson = useCallback(() => {
    if (!plan) return;
    exportPlanJson(plan, progress);
  }, [plan, progress]);


  if (loading) {
    return (
      <Box bg="bg.page" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="text.muted">Loading plan...</Text>
      </Box>
    );
  }

  if (error || !plan || weeks.length === 0) {
    return (
      <Box bg="bg.page" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center">
          <Text color="text.muted" mb={4}>{error ?? "Plan not found"}</Text>
          <Box
            as="button"
            onClick={() => navigate("/dashboard")}
            fontSize="14px"
            fontWeight="600"
            color="white"
            bg="#059669"
            px={4}
            py={2}
            borderRadius="md"
            border="none"
            cursor="pointer"
          >
            Back to dashboard
          </Box>
        </Box>
      </Box>
    );
  }

  const week = weeks[selectedWeek];

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="1100px" mx="auto" px={{ base: 2, md: 4 }} pb={8}>
        <Header
          weeks={weeks}
          planName={plan.name}
          raceDate={plan.race_date}
          progress={progress}
          colorMode={colorMode}
          onToggleColorMode={toggle}
          linkedFileEnabled={false}
          supportsLinkedFile={false}
          onLinkSaveFile={() => {}}
          onExportJson={handleExportJson}
          onBack={() => navigate("/dashboard")}
          stravaConnected={stravaConnected}
          syncingStrava={syncingStrava}
          onSyncStrava={() => void handleSyncStrava()}
        />
        {syncMessage && (
          <Box
            mx={4}
            mb={2}
            px={4}
            py={2}
            borderRadius="md"
            bg="bg.card"
            border="1px solid"
            borderColor="border.subtle"
            fontSize="12px"
            fontWeight="600"
            color="text.muted"
          >
            {syncMessage}
          </Box>
        )}

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
