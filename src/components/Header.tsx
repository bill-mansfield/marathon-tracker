import { Box, Flex, Text } from "@chakra-ui/react";
import { differenceInDays, parseISO } from "date-fns";
import type { ProgressMap } from "../data/types";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { COLORS } from "../theme";
import { getWeekActualKm, getRunnableDays } from "../lib/utils";

interface HeaderProps {
  progress: ProgressMap;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
}

export function Header({ progress, colorMode, onToggleColorMode }: HeaderProps) {
  const raceDate = parseISO("2026-09-13");
  const daysUntilRace = differenceInDays(raceDate, new Date());

  let totalRuns = 0;
  let completedRuns = 0;
  let totalKmLogged = 0;
  const totalKmPlanned = TRAINING_PLAN.reduce((s, w) => s + w.totalKm, 0);

  TRAINING_PLAN.forEach((week, wi) => {
    const runnable = getRunnableDays(week);
    totalRuns += runnable.length;
    runnable.forEach((d) => {
      const key = `${wi}-${d.day}`;
      if (progress[key]?.completed) completedRuns++;
    });
    totalKmLogged += getWeekActualKm(week, wi, progress);
  });

  return (
    <Box px={4} py={6} mb={2}>
      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <Text
            fontSize={{ base: "24px", md: "32px" }}
            fontWeight="700"
            color="text.primary"
            lineHeight="1.2"
          >
            Blue Mountains Marathon
          </Text>
          <Text fontSize="14px" color="text.muted" mt={1}>
            Training Tracker
          </Text>
        </Box>
        <Box
          as="button"
          onClick={onToggleColorMode}
          fontSize="20px"
          background="none"
          border="none"
          cursor="pointer"
          p={1}
          borderRadius="md"
          _hover={{ bg: "bg.muted" }}
        >
          {colorMode === "light" ? "🌙" : "☀️"}
        </Box>
      </Flex>

      <Flex gap={4} flexWrap="wrap">
        <StatBox
          label="Days to Race"
          value={daysUntilRace > 0 ? String(daysUntilRace) : "Race day!"}
          color={COLORS.emerald}
        />
        <StatBox
          label="Runs Completed"
          value={`${completedRuns}/${totalRuns}`}
          color={COLORS.sky}
        />
        <StatBox
          label="Km Logged"
          value={`${Math.round(totalKmLogged)}/${totalKmPlanned}`}
          color={COLORS.amber}
        />
      </Flex>
    </Box>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Box
      bg="bg.card"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      px={4}
      py={3}
      flex="1"
      minW="120px"
    >
      <Text fontSize="22px" fontWeight="700" color={color} lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="11px" color="text.muted" mt={1}>
        {label}
      </Text>
    </Box>
  );
}
