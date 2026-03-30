import { useState, useEffect, useCallback } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { parseISO, isWithinInterval, addDays } from "date-fns";
import type { ProgressMap, RunProgress } from "./data/types";
import { TRAINING_PLAN } from "./data/trainingPlan";
import { loadProgress, saveProgress } from "./lib/storage";
import { Header } from "./components/Header";
import { WeekCard } from "./components/WeekCard";
import { WeekTimeline } from "./components/WeekTimeline";
import { ProgressChart } from "./components/ProgressChart";

function useColorMode() {
  const [colorMode, setMode] = useState<"light" | "dark">(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("marathon-color-mode")
        : null;
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = colorMode;
    html.classList.toggle("dark", colorMode === "dark");
    localStorage.setItem("marathon-color-mode", colorMode);
  }, [colorMode]);

  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  return { colorMode, toggle };
}

function getCurrentWeekIndex(): number {
  const now = new Date();
  for (let i = 0; i < TRAINING_PLAN.length; i++) {
    const start = parseISO(TRAINING_PLAN[i].weekStart);
    const end = addDays(start, 6);
    if (isWithinInterval(now, { start, end })) return i;
  }
  return 0;
}

function App() {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const { colorMode, toggle } = useColorMode();
  const currentWeek = getCurrentWeekIndex();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateProgress = useCallback(
    (key: string, patch: Partial<RunProgress>) => {
      setProgress((prev) => ({
        ...prev,
        [key]: {
          completed: false,
          rating: 0,
          note: "",
          stravaUrl: "",
          actualKm: null,
          ...prev[key],
          ...patch,
        },
      }));
    },
    []
  );

  const week = TRAINING_PLAN[selectedWeek];

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="1100px" mx="auto" px={{ base: 2, md: 4 }} pb={8}>
        <Header
          progress={progress}
          colorMode={colorMode}
          onToggleColorMode={toggle}
        />

        <ProgressChart
          progress={progress}
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          colorMode={colorMode}
        />

        <WeekTimeline
          progress={progress}
          selectedWeek={selectedWeek}
          currentWeek={currentWeek}
          onSelectWeek={setSelectedWeek}
        />

        {/* Week navigation */}
        <HStack justify="space-between" mb={3} px={1}>
          <Box
            as="button"
            onClick={() => setSelectedWeek((w) => Math.max(0, w - 1))}
            disabled={selectedWeek === 0}
            opacity={selectedWeek === 0 ? 0.3 : 1}
            cursor={selectedWeek === 0 ? "default" : "pointer"}
            fontSize="13px"
            fontWeight="600"
            color="text.muted"
            background="none"
            border="none"
            _hover={{ color: "text.primary" }}
          >
            ← Prev week
          </Box>
          <Text fontSize="12px" color="text.faint">
            {selectedWeek + 1} of {TRAINING_PLAN.length}
          </Text>
          <Box
            as="button"
            onClick={() =>
              setSelectedWeek((w) =>
                Math.min(TRAINING_PLAN.length - 1, w + 1)
              )
            }
            disabled={selectedWeek === TRAINING_PLAN.length - 1}
            opacity={selectedWeek === TRAINING_PLAN.length - 1 ? 0.3 : 1}
            cursor={
              selectedWeek === TRAINING_PLAN.length - 1
                ? "default"
                : "pointer"
            }
            fontSize="13px"
            fontWeight="600"
            color="text.muted"
            background="none"
            border="none"
            _hover={{ color: "text.primary" }}
          >
            Next week →
          </Box>
        </HStack>

        <WeekCard
          week={week}
          weekIndex={selectedWeek}
          progress={progress}
          onUpdate={updateProgress}
          isCurrentWeek={selectedWeek === currentWeek}
        />
      </Box>
    </Box>
  );
}

export default App;
