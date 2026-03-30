import { useState, useEffect, useCallback, useRef } from "react";
import { Box, VStack } from "@chakra-ui/react";
import { parseISO, isWithinInterval, addDays } from "date-fns";
import type { ProgressMap, RunProgress } from "./data/types";
import { TRAINING_PLAN } from "./data/trainingPlan";
import { loadProgress, saveProgress } from "./lib/storage";
import { Header } from "./components/Header";
import { WeekCard } from "./components/WeekCard";

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
  const currentWeekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    currentWeekRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const updateProgress = useCallback(
    (key: string, patch: Partial<RunProgress>) => {
      setProgress((prev) => ({
        ...prev,
        [key]: {
          completed: false,
          rating: 0,
          note: "",
          stravaUrl: "",
          ...prev[key],
          ...patch,
        },
      }));
    },
    []
  );

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="1100px" mx="auto" px={{ base: 2, md: 4 }} pb={8}>
        <Header
          progress={progress}
          colorMode={colorMode}
          onToggleColorMode={toggle}
        />
        <VStack gap={3} align="stretch">
          {TRAINING_PLAN.map((week, i) => (
            <Box
              key={i}
              ref={i === currentWeek ? currentWeekRef : undefined}
            >
              <WeekCard
                week={week}
                weekIndex={i}
                progress={progress}
                onUpdate={updateProgress}
                isCurrentWeek={i === currentWeek}
                defaultOpen={i === currentWeek}
              />
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}

export default App;
