import { Box } from "@chakra-ui/react";
import type { PlanStatus } from "../data/types";

const STATUS_STYLES: Record<PlanStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: "#e2e8f0", color: "#475569", label: "Draft" },
  in_progress: { bg: "#d1fae5", color: "#065f46", label: "In Progress" },
  completed: { bg: "#dbeafe", color: "#1e40af", label: "Completed" },
};

export function StatusBadge({ status }: { status: PlanStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <Box
      as="span"
      display="inline-block"
      fontSize="10px"
      fontWeight="700"
      px="8px"
      py="2px"
      borderRadius="full"
      bg={style.bg}
      color={style.color}
      letterSpacing="0.02em"
      textTransform="uppercase"
    >
      {style.label}
    </Box>
  );
}
