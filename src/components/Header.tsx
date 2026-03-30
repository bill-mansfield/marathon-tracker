import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import { differenceInDays, parseISO } from "date-fns";
import type { ProgressMap } from "../data/types";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { COLORS } from "../theme";
import { getWeekActualKm, getRunnableDays } from "../lib/utils";
import { SunIcon, MoonIcon } from "./Icons";

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

  const kmPct = totalKmPlanned > 0 ? (totalKmLogged / totalKmPlanned) * 100 : 0;
  const runPct = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

  return (
    <Box px={4} pt={6} pb={4} position="relative" overflow="hidden">
      {/* Subtle topographic background texture */}
      <Box
        position="absolute"
        top="0"
        right="-20px"
        opacity={0.04}
        pointerEvents="none"
      >
        <svg width="320" height="200" viewBox="0 0 320 200" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M-20 180 Q40 120 100 140 T220 100 T340 120" />
          <path d="M-20 160 Q60 100 120 120 T240 80 T340 100" />
          <path d="M-20 140 Q80 80 140 100 T260 60 T340 80" />
          <path d="M-20 120 Q100 60 160 80 T280 40 T340 60" />
          <path d="M-20 100 Q120 40 180 60 T300 20 T340 40" />
        </svg>
      </Box>

      <Flex justify="space-between" align="start" mb={4}>
        <Box>
          <Text
            fontSize="10px"
            fontWeight="600"
            letterSpacing="0.12em"
            color="text.faint"
            textTransform="uppercase"
            mb="2px"
          >
            Training for
          </Text>
          <Text
            fontSize={{ base: "22px", md: "28px" }}
            fontWeight="800"
            color="text.primary"
            lineHeight="1.15"
            letterSpacing="-0.02em"
          >
            Blue Mountains
            <br />
            Marathon
          </Text>
          <Text fontSize="12px" color="text.muted" mt="4px">
            13 September 2026
          </Text>
        </Box>
        <Box
          as="button"
          onClick={onToggleColorMode}
          background="none"
          border="none"
          cursor="pointer"
          p="6px"
          borderRadius="md"
          color="text.muted"
          _hover={{ bg: "bg.muted", color: "text.primary" }}
          transition="all 0.15s"
          display="flex"
          alignItems="center"
        >
          {colorMode === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </Box>
      </Flex>

      {/* Inline stats bar */}
      <Flex
        gap={{ base: 3, md: 6 }}
        flexWrap="wrap"
        bg="bg.card"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        px={4}
        py={3}
      >
        <Box minW="60px">
          <Text fontSize="24px" fontWeight="800" color={COLORS.emerald} lineHeight="1" letterSpacing="-0.02em">
            {daysUntilRace > 0 ? String(daysUntilRace) : "0"}
          </Text>
          <Text fontSize="10px" color="text.muted" mt="1px">
            days to go
          </Text>
        </Box>
        <Box w="1px" bg="border.subtle" alignSelf="stretch" display={{ base: "none", md: "block" }} />
        <Box flex="1" minW="100px">
          <HStack justify="space-between" mb="3px">
            <Text fontSize="11px" color="text.muted">Runs</Text>
            <Text fontSize="11px" fontWeight="600" color={COLORS.sky}>
              {completedRuns}/{totalRuns}
            </Text>
          </HStack>
          <Box h="4px" bg="bg.muted" borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${runPct}%`} bg={COLORS.sky} borderRadius="full" transition="width 0.3s" />
          </Box>
        </Box>
        <Box w="1px" bg="border.subtle" alignSelf="stretch" display={{ base: "none", md: "block" }} />
        <Box flex="1" minW="100px">
          <HStack justify="space-between" mb="3px">
            <Text fontSize="11px" color="text.muted">Distance</Text>
            <Text fontSize="11px" fontWeight="600" color={COLORS.amber}>
              {Math.round(totalKmLogged)}/{totalKmPlanned}km
            </Text>
          </HStack>
          <Box h="4px" bg="bg.muted" borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${kmPct}%`} bg={COLORS.amber} borderRadius="full" transition="width 0.3s" />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
