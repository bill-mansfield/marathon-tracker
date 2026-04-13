import { Box, Flex, Text } from "@chakra-ui/react";
import { format, parseISO } from "date-fns";
import type { TrainingPlan } from "../data/types";
import { StatusBadge } from "./StatusBadge";
import { COLORS } from "../theme";

const GOAL_LABELS: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half Marathon",
  marathon: "Marathon",
  "50k": "50K Ultra",
  "100k": "100K Ultra",
};

interface PlanCardProps {
  plan: TrainingPlan;
  onClick: () => void;
  onDelete?: () => void;
}

export function PlanCard({ plan, onClick, onDelete }: PlanCardProps) {
  const totalWeeks = plan.weeks.length;
  const goalLabel = GOAL_LABELS[plan.goal] ?? plan.goal;

  return (
    <Box
      bg="bg.card"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={5}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.15s"
      _hover={{ borderColor: COLORS.emerald, transform: "translateY(-1px)" }}
      position="relative"
    >
      <Flex justify="space-between" align="start" mb={2}>
        <Box>
          <Text fontSize="16px" fontWeight="700" color="text.primary" lineHeight="1.2">
            {plan.name}
          </Text>
          <Text fontSize="12px" color="text.muted" mt="2px">
            {goalLabel} {plan.race_type === "trail" ? "(Trail)" : ""}
          </Text>
        </Box>
        <StatusBadge status={plan.status} />
      </Flex>

      <Flex gap={4} mt={3} flexWrap="wrap">
        <Box>
          <Text fontSize="10px" color="text.faint" textTransform="uppercase" fontWeight="600">
            Race Date
          </Text>
          <Text fontSize="13px" fontWeight="600" color="text.primary">
            {format(parseISO(plan.race_date), "d MMM yyyy")}
          </Text>
        </Box>
        <Box>
          <Text fontSize="10px" color="text.faint" textTransform="uppercase" fontWeight="600">
            Weeks
          </Text>
          <Text fontSize="13px" fontWeight="600" color="text.primary">
            {totalWeeks}
          </Text>
        </Box>
        <Box>
          <Text fontSize="10px" color="text.faint" textTransform="uppercase" fontWeight="600">
            Peak Volume
          </Text>
          <Text fontSize="13px" fontWeight="600" color="text.primary">
            {Math.max(...plan.weeks.map((w) => w.totalKm))}km
          </Text>
        </Box>
      </Flex>

      {onDelete && (
        <Box
          as="button"
          position="absolute"
          top="12px"
          right="12px"
          fontSize="11px"
          color="text.faint"
          background="none"
          border="none"
          cursor="pointer"
          _hover={{ color: COLORS.red }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </Box>
      )}
    </Box>
  );
}
