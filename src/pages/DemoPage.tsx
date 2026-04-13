import { useState, useEffect, useCallback } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { parseISO, isWithinInterval, addDays } from "date-fns";
import type { ProgressMap, RunProgress } from "../data/types";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { DEFAULT_PROGRESS, getExtraRunKey } from "../lib/utils";
import {
  downloadProgressFile,
  hasLinkedProgressFile,
  linkProgressFile,
  loadLinkedProgress,
  loadProgress,
  saveProgress,
  supportsLinkedProgressFile,
  syncProgressToLinkedFile,
} from "../lib/storage";
import { Header } from "../components/Header";
import { WeekCard } from "../components/WeekCard";
import { WeekTimeline } from "../components/WeekTimeline";
import { ProgressChart } from "../components/ProgressChart";
import { useColorMode } from "../hooks/useColorMode";

function getCurrentWeekIndex(): number {
  const now = new Date();
  for (let i = 0; i < TRAINING_PLAN.length; i++) {
    const start = parseISO(TRAINING_PLAN[i].weekStart);
    const end = addDays(start, 6);
    if (isWithinInterval(now, { start, end })) return i;
  }
  return 0;
}

export function DemoPage() {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const { colorMode, toggle } = useColorMode();
  const currentWeek = getCurrentWeekIndex();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [linkedFileEnabled, setLinkedFileEnabled] = useState(false);
  const supportsLinkedFile = supportsLinkedProgressFile();

  // Derive the race date from the last week in the plan
  const lastWeek = TRAINING_PLAN[TRAINING_PLAN.length - 1];
  const raceDateStr = lastWeek.weekStart; // close enough — race is during the last week

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    async function hydrateFromLinkedFile() {
      const [isLinked, linkedProgress] = await Promise.all([
        hasLinkedProgressFile(),
        loadLinkedProgress(),
      ]);
      if (cancelled) return;
      setLinkedFileEnabled(isLinked);
      if (linkedProgress) setProgress(linkedProgress);
    }
    void hydrateFromLinkedFile();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!linkedFileEnabled) return;
    void syncProgressToLinkedFile(progress);
  }, [linkedFileEnabled, progress]);

  const updateProgress = useCallback(
    (key: string, patch: Partial<RunProgress>) => {
      setProgress((prev) => ({
        ...prev,
        [key]: { ...DEFAULT_PROGRESS, ...(prev[key] ?? {}), ...patch },
      }));
    },
    []
  );

  const addRun = useCallback(
    (day: (typeof TRAINING_PLAN)[number]["days"][number]["day"]) => {
      const key = getExtraRunKey(selectedWeek, day);
      setProgress((prev) => ({
        ...prev,
        [key]: { ...DEFAULT_PROGRESS, isExtra: true, description: "Extra run", actualKm: 5 },
      }));
    },
    [selectedWeek]
  );

  const removeRun = useCallback((key: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleLinkSaveFile = useCallback(async () => {
    const linked = await linkProgressFile(progress);
    setLinkedFileEnabled(linked);
  }, [progress]);

  const handleExportJson = useCallback(() => {
    downloadProgressFile(progress);
  }, [progress]);


  const week = TRAINING_PLAN[selectedWeek];

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="1100px" mx="auto" px={{ base: 2, md: 4 }} pb={8}>
        <Header
          weeks={TRAINING_PLAN}
          planName={"Blue Mountains\nMarathon"}
          raceDate={raceDateStr}
          progress={progress}
          colorMode={colorMode}
          onToggleColorMode={toggle}
          linkedFileEnabled={linkedFileEnabled}
          supportsLinkedFile={supportsLinkedFile}
          onLinkSaveFile={handleLinkSaveFile}
          onExportJson={handleExportJson}
        />

        <ProgressChart
          weeks={TRAINING_PLAN}
          progress={progress}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          colorMode={colorMode}
        />

        <WeekTimeline
          weeks={TRAINING_PLAN}
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
            {selectedWeek + 1} of {TRAINING_PLAN.length}
          </Text>
          <Box
            as="button"
            onClick={() =>
              setSelectedWeek((w) => Math.min(TRAINING_PLAN.length - 1, w + 1))
            }
            aria-disabled={selectedWeek === TRAINING_PLAN.length - 1}
            opacity={selectedWeek === TRAINING_PLAN.length - 1 ? 0.3 : 1}
            cursor={selectedWeek === TRAINING_PLAN.length - 1 ? "default" : "pointer"}
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
