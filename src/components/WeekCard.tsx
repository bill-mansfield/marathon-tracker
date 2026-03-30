import { Box, Flex, Grid, Text, HStack } from "@chakra-ui/react";
import { format, addDays, parseISO } from "date-fns";
import type { PlanWeek, ProgressMap, RunProgress } from "../data/types";
import { DayCell } from "./DayCell";
import { COLORS } from "../theme";
import { getWeekActualKm, getRunnableDays, getCompletedCount } from "../lib/utils";

// Simplified to 4 phase colours
function getPhaseColor(weekType: string): string {
  if (weekType.includes("Cutback") || weekType.includes("Taper") || weekType.includes("Wind") || weekType.includes("Absorption"))
    return "#10b981"; // recovery — green
  if (weekType.includes("Specific") || weekType.includes("Peak"))
    return "#ef4444"; // intensity — red
  if (weekType === "Race Week")
    return "#d97706"; // race — amber
  return "#64748b"; // base/build — slate
}

interface WeekCardProps {
  week: PlanWeek;
  weekIndex: number;
  progress: ProgressMap;
  onUpdate: (key: string, patch: Partial<RunProgress>) => void;
  isCurrentWeek: boolean;
}

export function WeekCard({
  week,
  weekIndex,
  progress,
  onUpdate,
  isCurrentWeek,
}: WeekCardProps) {
  const start = parseISO(week.weekStart);
  const end = addDays(start, 6);
  const dateRange = `${format(start, "d MMM")} – ${format(end, "d MMM")}`;

  const runnableDays = getRunnableDays(week);
  const completedCount = getCompletedCount(week, weekIndex, progress);
  const actualKm = getWeekActualKm(week, weekIndex, progress);
  const phaseColor = getPhaseColor(week.weekType);

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor={isCurrentWeek ? "rgba(5, 150, 105, 0.4)" : "border.subtle"}
      bg="bg.card"
      overflow="hidden"
      shadow={isCurrentWeek ? "0 0 0 1px rgba(5, 150, 105, 0.15)" : undefined}
      borderLeft="3px solid"
      borderLeftColor={phaseColor}
    >
      {/* Header */}
      <Box px={4} py={3}>
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <HStack gap={3}>
            {isCurrentWeek && (
              <Box
                w="7px"
                h="7px"
                borderRadius="full"
                bg={COLORS.emerald}
                flexShrink={0}
              />
            )}
            <Box>
              <HStack gap={2} align="baseline">
                <Text fontSize="14px" fontWeight="600" color="text.primary" lineHeight="1.3">
                  {dateRange}
                </Text>
                <Text fontSize="11px" color="text.faint">
                  W{weekIndex + 1}
                </Text>
              </HStack>
              <Text fontSize="11px" color="text.muted" mt="1px">
                {week.weekType}
              </Text>
            </Box>
          </HStack>
          <HStack gap={4}>
            <Text fontSize="13px" fontWeight="700" color={COLORS.emerald} letterSpacing="-0.01em">
              {actualKm > 0
                ? `${Math.round(actualKm * 10) / 10}/${week.totalKm}km`
                : `${week.totalKm}km`}
            </Text>
            <Text fontSize="11px" color="text.faint">
              {completedCount}/{runnableDays.length} runs
            </Text>
          </HStack>
        </Flex>
      </Box>

      {/* Day grid */}
      <Box px={4} pb={4}>
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(7, 1fr)",
          }}
          gap={2}
          mb={week.notes || week.longRunPlan ? 3 : 0}
        >
          {week.days.map((day) => {
            const key = `${weekIndex}-${day.day}`;
            return (
              <DayCell
                key={key}
                planDay={day}
                progress={
                  progress[key] ?? {
                    completed: false,
                    rating: 0,
                    note: "",
                    stravaUrl: "",
                    actualKm: null,
                  }
                }
                onUpdate={(patch) => onUpdate(key, patch)}
              />
            );
          })}
        </Grid>
        {(week.notes || week.longRunPlan) && (
          <Flex
            gap={3}
            flexWrap="wrap"
            pt={1}
            borderTop="1px solid"
            borderColor="border.subtle"
            mt={1}
          >
            {week.notes && (
              <Text fontSize="11px" color="text.muted" fontStyle="italic">
                {week.notes}
              </Text>
            )}
            {week.longRunPlan && (
              <Text fontSize="11px" color="text.faint">
                Long run: {week.longRunPlan}
              </Text>
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
