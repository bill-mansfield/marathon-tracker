import { useRef, useEffect, useState, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { format, parseISO } from "date-fns";
import type { PlanWeek, ProgressMap } from "../data/types";
import {
  getRunTotals,
  getWeekActualKm,
} from "../lib/utils";
import { COLORS } from "../theme";

// Simplified phase colour matching WeekCard
function getPhaseColor(weekType: string): string {
  if (weekType.includes("Cutback") || weekType.includes("Taper") || weekType.includes("Wind") || weekType.includes("Absorption"))
    return "#10b981";
  if (weekType.includes("Specific") || weekType.includes("Peak"))
    return "#ef4444";
  if (weekType === "Race Week")
    return "#d97706";
  return "#64748b";
}

interface WeekTimelineProps {
  weeks: PlanWeek[];
  progress: ProgressMap;
  selectedWeek: number;
  currentWeek: number;
  onSelectWeek: (index: number) => void;
}

export function WeekTimeline({
  weeks,
  progress,
  selectedWeek,
  currentWeek,
  onSelectWeek,
}: WeekTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 8);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedWeek]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [updateFades]);

  return (
    <Box
      bg="bg.card"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={3}
      mb={4}
      position="relative"
    >
      <Text fontSize="12px" fontWeight="600" color="text.muted" mb={2} letterSpacing="0.02em">
        Training Journey
      </Text>

      {/* Left fade hint */}
      {showLeftFade && (
        <Box
          position="absolute"
          left="0"
          top="36px"
          bottom="0"
          w="32px"
          pointerEvents="none"
          zIndex={2}
          borderRadius="0 0 0 lg"
          bgGradient="linear(to-r, var(--chakra-colors-bg-card), transparent)"
          css={{ background: "linear-gradient(to right, var(--chakra-colors-bg-card, #faf8f5), transparent)" }}
        />
      )}

      {/* Right fade hint */}
      {showRightFade && (
        <Box
          position="absolute"
          right="0"
          top="36px"
          bottom="0"
          w="32px"
          pointerEvents="none"
          zIndex={2}
          borderRadius="0 0 lg 0"
          css={{ background: "linear-gradient(to left, var(--chakra-colors-bg-card, #faf8f5), transparent)" }}
        />
      )}

      <Flex
        ref={scrollRef}
        gap="6px"
        overflowX="auto"
        pb={2}
        css={{
          "&::-webkit-scrollbar": { height: "4px" },
          "&::-webkit-scrollbar-thumb": {
            background: "#d9cfc2",
            borderRadius: "2px",
          },
        }}
      >
        {weeks.map((week, i) => {
          const runTotals = getRunTotals(week, i, progress);
          const actualKm = getWeekActualKm(week, i, progress);
          const fillPct =
            runTotals.total > 0
              ? (runTotals.completed / runTotals.total) * 100
              : 0;
          const isSelected = i === selectedWeek;
          const isCurrent = i === currentWeek;
          const phaseColor = getPhaseColor(week.weekType);

          return (
            <Box
              key={i}
              ref={isSelected ? selectedRef : undefined}
              as="button"
              onClick={() => onSelectWeek(i)}
              flexShrink={0}
              w="60px"
              p="6px"
              borderRadius="md"
              border="2px solid"
              borderColor={
                isSelected
                  ? COLORS.emerald
                  : isCurrent
                    ? "rgba(5, 150, 105, 0.3)"
                    : "transparent"
              }
              bg={isSelected ? "rgba(5, 150, 105, 0.06)" : "bg.muted"}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ borderColor: "rgba(5, 150, 105, 0.4)" }}
              textAlign="center"
              position="relative"
              background="none"
            >
              {/* Week type phase bar */}
              <Box
                h="4px"
                borderRadius="full"
                bg={phaseColor}
                mb="4px"
              />

              {/* Week number */}
              <Text
                fontSize="11px"
                fontWeight="700"
                color={isSelected ? COLORS.emerald : "text.primary"}
                lineHeight="1"
              >
                W{i + 1}
              </Text>

              {/* Date */}
              <Text fontSize="9px" color="text.faint" lineHeight="1.2" mt="2px">
                {format(parseISO(week.weekStart), "d MMM")}
              </Text>

              {/* Progress fill bar */}
              <Box
                mt="4px"
                h="4px"
                borderRadius="full"
                bg="bg.subtle"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${fillPct}%`}
                  bg={COLORS.emerald}
                  borderRadius="full"
                  transition="width 0.3s"
                />
              </Box>

              {/* Km summary */}
              <Text
                fontSize="9px"
                color="text.faint"
                lineHeight="1"
                mt="3px"
              >
                {actualKm > 0
                  ? `${Math.round(actualKm)}/${week.totalKm}`
                  : `${week.totalKm}km`}
              </Text>

              {/* Current week dot */}
              {isCurrent && (
                <Box
                  position="absolute"
                  top="-3px"
                  right="-3px"
                  w="7px"
                  h="7px"
                  borderRadius="full"
                  bg={COLORS.emerald}
                  border="1.5px solid"
                  borderColor="bg.card"
                />
              )}
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
