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
  colorMode: "light" | "dark";
}

export function ProgressChart({
  progress,
  selectedWeek,
  onSelectWeek,
  colorMode,
}: ProgressChartProps) {
  const maxKm = Math.max(...TRAINING_PLAN.map((w) => w.totalKm));
  const plannedBarColor = colorMode === "dark" ? "#4a4035" : "#cdc4b8";
  const selectedBarColor = colorMode === "dark" ? "#1a3a2a" : "#c8ddd3";

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
        <Text fontSize="12px" fontWeight="600" color="text.muted" letterSpacing="0.02em">
          Weekly Volume
        </Text>
        <Flex gap={4}>
          <Flex align="center" gap="5px">
            <Box w="8px" h="8px" borderRadius="1.5px" bg={plannedBarColor} />
            <Text fontSize="10px" color="text.faint">Planned</Text>
          </Flex>
          <Flex align="center" gap="5px">
            <Box w="8px" h="8px" borderRadius="1.5px" bg={COLORS.emerald} />
            <Text fontSize="10px" color="text.faint">Actual</Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex align="flex-end" gap="3px" h="130px">
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
              css={{
                "& .bar": { transition: "all 0.15s" },
                "&:hover .bar": { opacity: 0.8 },
              }}
            >
              <Box
                className="bar"
                w="100%"
                h={`${plannedH}%`}
                bg={isSelected ? selectedBarColor : plannedBarColor}
                borderRadius="2px 2px 0 0"
                position="relative"
                border={isSelected ? `1.5px solid ${COLORS.emerald}` : "none"}
                borderBottom="none"
              >
                {d.actual > 0 && (
                  <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h={`${(actualH / plannedH) * 100}%`}
                    bg={COLORS.emerald}
                    transition="height 0.3s"
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Flex>

      {/* X-axis labels */}
      <Flex mt="6px" justify="space-between">
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
