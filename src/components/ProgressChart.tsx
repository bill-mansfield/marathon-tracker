import { Box, Flex, Text } from "@chakra-ui/react";
import { format, parseISO } from "date-fns";
import type { ProgressMap } from "../data/types";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { getWeekActualKm } from "../lib/utils";
import { COLORS } from "../theme";

interface ProgressChartProps {
  progress: ProgressMap;
  selectedWeek: number;
  onSelectWeek: (index: number) => void;
}

export function ProgressChart({
  progress,
  selectedWeek,
  onSelectWeek,
}: ProgressChartProps) {
  const maxKm = Math.max(...TRAINING_PLAN.map((w) => w.totalKm));

  const data = TRAINING_PLAN.map((week, i) => ({
    index: i,
    label: format(parseISO(week.weekStart), "d MMM"),
    planned: week.totalKm,
    actual: getWeekActualKm(week, i, progress),
    weekType: week.weekType,
  }));

  return (
    <Box
      bg="bg.card"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="13px" fontWeight="600" color="text.muted">
          Weekly Volume (km)
        </Text>
        <Flex gap={4}>
          <Flex align="center" gap={1}>
            <Box w="10px" h="10px" borderRadius="2px" bg="#b8ad9e" />
            <Text fontSize="10px" color="text.faint">Planned</Text>
          </Flex>
          <Flex align="center" gap={1}>
            <Box w="10px" h="10px" borderRadius="2px" bg={COLORS.emerald} />
            <Text fontSize="10px" color="text.faint">Actual</Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex align="flex-end" gap="3px" h="140px">
        {data.map((d) => {
          const plannedH = (d.planned / maxKm) * 100;
          const actualH = (d.actual / maxKm) * 100;
          const isSelected = d.index === selectedWeek;

          return (
            <Box
              key={d.index}
              flex="1"
              h="100%"
              display="flex"
              flexDirection="column"
              justifyContent="flex-end"
              cursor="pointer"
              onClick={() => onSelectWeek(d.index)}
              position="relative"
              title={`W${d.index + 1}: ${d.actual > 0 ? `${Math.round(d.actual)}/${d.planned}km` : `${d.planned}km planned`}`}
            >
              {/* Planned bar (background) */}
              <Box
                w="100%"
                h={`${plannedH}%`}
                bg={isSelected ? "#c8ddd3" : "#cdc4b8"}
                borderRadius="2px 2px 0 0"
                position="relative"
                border={isSelected ? `1.5px solid ${COLORS.emerald}` : "none"}
                borderBottom="none"
                transition="all 0.15s"
              >
                {/* Actual bar (overlay from bottom) */}
                {d.actual > 0 && (
                  <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h={`${(actualH / plannedH) * 100}%`}
                    bg={COLORS.emerald}
                    borderRadius="0 0 0 0"
                    transition="height 0.3s"
                  />
                )}
              </Box>

              {/* Week label on hover / selected */}
              {isSelected && (
                <Text
                  fontSize="8px"
                  color={COLORS.emerald}
                  fontWeight="700"
                  textAlign="center"
                  mt="2px"
                  lineHeight="1"
                >
                  W{d.index + 1}
                </Text>
              )}
            </Box>
          );
        })}
      </Flex>

      {/* X-axis labels */}
      <Flex mt={1} justify="space-between">
        {data
          .filter((_, i) => i % 4 === 0 || i === data.length - 1)
          .map((d) => (
            <Text key={d.index} fontSize="9px" color="text.faint">
              {d.label}
            </Text>
          ))}
      </Flex>
    </Box>
  );
}
