import { Box, Flex, Grid, Text, HStack } from "@chakra-ui/react";
import { format, addDays, parseISO } from "date-fns";
import type { PlanWeek, ProgressMap, RunProgress } from "../data/types";
import { DayCell } from "./DayCell";
import { WEEK_TYPE_COLORS } from "../theme";

interface WeekCardProps {
  week: PlanWeek;
  weekIndex: number;
  progress: ProgressMap;
  onUpdate: (key: string, patch: Partial<RunProgress>) => void;
  isCurrentWeek: boolean;
  defaultOpen?: boolean;
}

export function WeekCard({
  week,
  weekIndex,
  progress,
  onUpdate,
  isCurrentWeek,
  defaultOpen = false,
}: WeekCardProps) {
  const start = parseISO(week.weekStart);
  const end = addDays(start, 6);
  const dateRange = `${format(start, "d MMM")} – ${format(end, "d MMM")}`;

  const runnableDays = week.days.filter(
    (d) => d.km > 0 || d.description.toLowerCase().includes("shakeout")
  );
  const completedCount = runnableDays.filter((d) => {
    const key = `${weekIndex}-${d.day}`;
    return progress[key]?.completed;
  }).length;

  const typeColor = WEEK_TYPE_COLORS[week.weekType] ?? {
    bg: "#e2e8f0",
    text: "#475569",
  };

  const details = (
    <Box>
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
                }
              }
              onUpdate={(patch) => onUpdate(key, patch)}
            />
          );
        })}
      </Grid>
      {(week.notes || week.longRunPlan) && (
        <Flex gap={4} flexWrap="wrap" px={1}>
          {week.notes && (
            <Text fontSize="12px" color="text.muted">
              📋 {week.notes}
            </Text>
          )}
          {week.longRunPlan && (
            <Text fontSize="12px" color="text.muted">
              🏔️ {week.longRunPlan}
            </Text>
          )}
        </Flex>
      )}
    </Box>
  );

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor={isCurrentWeek ? "rgba(5, 150, 105, 0.4)" : "border.subtle"}
      bg="bg.card"
      overflow="hidden"
      shadow={isCurrentWeek ? "0 0 0 1px rgba(5, 150, 105, 0.2)" : undefined}
    >
      <Box
        as="details"
        open={defaultOpen || undefined}
        css={{
          "& > summary": {
            listStyle: "none",
            cursor: "pointer",
          },
          "& > summary::-webkit-details-marker": {
            display: "none",
          },
        }}
      >
        <Box
          as="summary"
          px={4}
          py={3}
          _hover={{ bg: "bg.muted" }}
          transition="background 0.15s"
        >
          <Flex
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={2}
          >
            <HStack gap={3}>
              {isCurrentWeek && (
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg="#059669"
                  flexShrink={0}
                />
              )}
              <Box>
                <Text
                  fontSize="14px"
                  fontWeight="600"
                  color="text.primary"
                  lineHeight="1.3"
                >
                  {dateRange}
                </Text>
                <Text fontSize="12px" color="text.muted">
                  Week {weekIndex + 1}
                </Text>
              </Box>
              <Box
                px={2}
                py={0.5}
                borderRadius="full"
                fontSize="11px"
                fontWeight="600"
                bg={typeColor.bg}
                color={typeColor.text}
              >
                {week.weekType}
              </Box>
            </HStack>
            <HStack gap={4}>
              <Text fontSize="13px" fontWeight="600" color="text.primary">
                {week.totalKm}km
              </Text>
              <Text fontSize="12px" color="text.muted">
                {completedCount}/{runnableDays.length} runs
              </Text>
            </HStack>
          </Flex>
        </Box>
        <Box px={4} pb={4} pt={2}>
          {details}
        </Box>
      </Box>
    </Box>
  );
}
