import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import { differenceInDays, parseISO } from "date-fns";
import type { ProgressMap } from "../data/types";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { COLORS } from "../theme";

interface HeaderProps {
  progress: ProgressMap;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
}

export function Header({ progress, colorMode, onToggleColorMode }: HeaderProps) {
  const raceDate = parseISO("2026-09-13");
  const daysUntilRace = differenceInDays(raceDate, new Date());

  const allRunnable = TRAINING_PLAN.flatMap((week, wi) =>
    week.days
      .filter((d) => d.km > 0 || d.description.toLowerCase().includes("shakeout"))
      .map((d) => ({ key: `${wi}-${d.day}`, km: d.km }))
  );

  const completedRuns = allRunnable.filter((r) => progress[r.key]?.completed);
  const totalKmCompleted = completedRuns.reduce((sum, r) => sum + r.km, 0);

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
          value={`${completedRuns.length}/${allRunnable.length}`}
          color={COLORS.sky}
        />
        <StatBox
          label="Km Logged"
          value={`${Math.round(totalKmCompleted)}`}
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
