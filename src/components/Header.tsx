import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import { differenceInDays, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { PlanWeek, ProgressMap } from "../data/types";
import { COLORS } from "../theme";
import { getRunTotals, getWeekActualKm } from "../lib/utils";
import { SunIcon, MoonIcon, BuildWeeksLogo } from "./Icons";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  weeks: PlanWeek[];
  planName: string;
  raceDate: string; // ISO date string
  progress: ProgressMap;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  linkedFileEnabled: boolean;
  supportsLinkedFile: boolean;
  onLinkSaveFile: () => void;
  onExportJson: () => void;
  onBack?: () => void;
  stravaConnected?: boolean;
  syncingStrava?: boolean;
  onSyncStrava?: () => void;
  hideAuthButtons?: boolean;
}

export function Header({
  weeks,
  planName,
  raceDate: raceDateStr,
  progress,
  colorMode,
  onToggleColorMode,
  linkedFileEnabled,
  supportsLinkedFile,
  onLinkSaveFile,
  onExportJson,
  onBack,
  stravaConnected,
  syncingStrava,
  onSyncStrava,
  hideAuthButtons,
}: HeaderProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const raceDate = parseISO(raceDateStr);
  const daysUntilRace = differenceInDays(raceDate, new Date());

  let totalRuns = 0;
  let completedRuns = 0;
  let totalKmLogged = 0;
  const totalKmPlanned = weeks.reduce((s, w) => s + w.totalKm, 0);

  weeks.forEach((week, wi) => {
    const runTotals = getRunTotals(week, wi, progress);
    totalRuns += runTotals.total;
    completedRuns += runTotals.completed;
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

      <Flex justify="space-between" align="start" mb={4} gap={4}>
        <Box>
          {onBack && (
            <Box mb="8px" _hover={{ opacity: 0.7 }} transition="opacity 0.15s">
              <BuildWeeksLogo iconSize={16} onClick={onBack} />
            </Box>
          )}
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
            {planName}
          </Text>
          <Text fontSize="12px" color="text.muted" mt="4px">
            {raceDate.toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Box>
        <Flex
          direction="column"
          align="end"
          gap={2}
          flexShrink={0}
        >
          <HStack gap={2} flexWrap="wrap" justify="end">
            {stravaConnected && onSyncStrava && (
              <Box
                as="button"
                onClick={onSyncStrava}
                fontSize="12px"
                fontWeight="700"
                px={3}
                py={2}
                borderRadius="full"
                bg={syncingStrava ? "bg.muted" : "#fc4c02"}
                color={syncingStrava ? "text.muted" : "white"}
                border="none"
                cursor={syncingStrava ? "wait" : "pointer"}
                opacity={syncingStrava ? 0.7 : 1}
                _hover={{ opacity: syncingStrava ? 0.7 : 0.9 }}
              >
                {syncingStrava ? "Syncing..." : "Sync Strava"}
              </Box>
            )}
            {supportsLinkedFile ? (
              <Box
                as="button"
                onClick={onLinkSaveFile}
                fontSize="12px"
                fontWeight="700"
                px={3}
                py={2}
                borderRadius="full"
                bg={linkedFileEnabled ? "green.500" : "bg.card"}
                color={linkedFileEnabled ? "white" : "text.primary"}
                border="1px solid"
                borderColor={linkedFileEnabled ? "green.500" : "border.subtle"}
                _hover={{ transform: "translateY(-1px)" }}
              >
                {linkedFileEnabled ? "JSON linked" : "Link JSON save"}
              </Box>
            ) : null}
            <Box
              as="button"
              onClick={onExportJson}
              fontSize="12px"
              fontWeight="700"
              px={3}
              py={2}
              borderRadius="full"
              bg="bg.card"
              color="text.primary"
              border="1px solid"
              borderColor="border.subtle"
              _hover={{ transform: "translateY(-1px)" }}
            >
              Export plan backup
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
            {!hideAuthButtons && (
              <>
                <Box
                  as="button"
                  onClick={() => navigate("/settings")}
                  fontSize="12px"
                  fontWeight="600"
                  color="text.muted"
                  background="none"
                  border="none"
                  cursor="pointer"
                  whiteSpace="nowrap"
                  _hover={{ color: "text.primary" }}
                >
                  Settings
                </Box>
                <Box
                  as="button"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  fontSize="12px"
                  fontWeight="600"
                  color="text.muted"
                  background="none"
                  border="none"
                  cursor="pointer"
                  whiteSpace="nowrap"
                  _hover={{ color: "text.primary" }}
                >
                  Sign out
                </Box>
              </>
            )}
          </HStack>
        </Flex>
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
