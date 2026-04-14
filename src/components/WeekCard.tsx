import { Box, Flex, Grid, Text, HStack } from "@chakra-ui/react";
import { format, addDays, parseISO } from "date-fns";
import type { DayName, PlanWeek, ProgressMap, RunProgress } from "../data/types";
import { DayCell } from "./DayCell";
import { COLORS } from "../theme";
import {
  DEFAULT_PROGRESS,
  getExtraRunsForDay,
  getProgressKey,
  getRunTotals,
  getWeekActualKm,
} from "../lib/utils";

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
  onAddRun: (day: DayName) => void;
  onRemoveRun: (key: string) => void;
  isCurrentWeek: boolean;
}

export function WeekCard({
  week,
  weekIndex,
  progress,
  onUpdate,
  onAddRun,
  onRemoveRun,
  isCurrentWeek,
}: WeekCardProps) {
  const start = parseISO(week.weekStart);
  const end = addDays(start, 6);
  const dateRange = `${format(start, "d MMM")} – ${format(end, "d MMM")}`;

  const runTotals = getRunTotals(week, weekIndex, progress);
  const actualKm = getWeekActualKm(week, weekIndex, progress);
  const phaseColor = getPhaseColor(week.weekType);

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor={isCurrentWeek ? "rgba(5, 150, 105, 0.4)" : "border.subtle"}
      bg="bg.card"
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
              {runTotals.completed}/{runTotals.total} runs
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
            const key = getProgressKey(weekIndex, day.day);
            const plannedProgress = progress[key] ?? DEFAULT_PROGRESS;
            const extras = getExtraRunsForDay(weekIndex, day.day, progress);
            return (
              <Flex key={key} direction="column" gap={2}>
                <Text
                  display={{ base: "block", lg: "none" }}
                  fontSize="10px"
                  fontWeight="700"
                  color="text.muted"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  pt={1}
                >
                  {day.day}
                </Text>
                {plannedProgress.deleted ? (
                  <Box
                    borderRadius="md"
                    border="1px dashed"
                    borderColor="border.subtle"
                    bg="bg.muted"
                    color="text.muted"
                    px={3}
                    py={2}
                  >
                    <HStack justify="space-between" gap={2}>
                      <Text fontSize="11px">
                        {day.day} run deleted
                      </Text>
                      <Box
                        as="button"
                        onClick={() => onUpdate(key, { deleted: false })}
                        fontSize="11px"
                        fontWeight="700"
                        color={COLORS.emerald}
                        background="none"
                        border="none"
                        cursor="pointer"
                      >
                        Undo
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <DayCell
                    planDay={day}
                    progress={plannedProgress}
                    onUpdate={(patch) => onUpdate(key, patch)}
                    onRemove={() =>
                      onUpdate(key, {
                        completed: false,
                        deleted: true,
                      })
                    }
                    removeLabel="Delete"
                  />
                )}
                {extras.map(([extraKey, extra]) => (
                  <DayCell
                    key={extraKey}
                    planDay={{
                      day: day.day,
                      km: extra.actualKm ?? 0,
                      description: extra.description ?? "Extra run",
                    }}
                    progress={extra}
                    onUpdate={(patch) => onUpdate(extraKey, patch)}
                    onRemove={() => onRemoveRun(extraKey)}
                    removeLabel="Delete"
                  />
                ))}
                <Box
                  as="button"
                  onClick={() => onAddRun(day.day)}
                  borderRadius="md"
                  border="1px dashed"
                  borderColor="border.subtle"
                  bg="bg.muted"
                  color="text.muted"
                  py={2}
                  px={2}
                  fontSize="11px"
                  fontWeight="600"
                  _hover={{ color: "text.primary", borderColor: COLORS.emerald }}
                >
                  + Add run
                </Box>
              </Flex>
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
