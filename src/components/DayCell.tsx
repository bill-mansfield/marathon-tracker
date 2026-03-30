import { useState } from "react";
import { Box, HStack, Text, Input } from "@chakra-ui/react";
import type { PlanDay, RunProgress } from "../data/types";
import { StarRating } from "./StarRating";
import { NotePopover } from "./NotePopover";
import { StravaPopover } from "./StravaPopover";
import { COLORS } from "../theme";
import { isRestDay } from "../lib/utils";

interface DayCellProps {
  planDay: PlanDay;
  progress: RunProgress;
  onUpdate: (patch: Partial<RunProgress>) => void;
}

const DEFAULT_PROGRESS: RunProgress = {
  completed: false,
  rating: 0,
  note: "",
  stravaUrl: "",
  actualKm: null,
};

export function DayCell({ planDay, progress = DEFAULT_PROGRESS, onUpdate }: DayCellProps) {
  const [editingKm, setEditingKm] = useState(false);
  const rest = isRestDay(planDay.description, planDay.km);

  if (rest) {
    return (
      <Box
        p={2}
        borderRadius="md"
        bg="bg.muted"
        opacity={0.5}
        minH="70px"
      >
        <Text fontSize="11px" fontWeight="600" color="text.faint" mb={1}>
          {planDay.day}
        </Text>
        <Text fontSize="12px" color="text.faint">Rest</Text>
      </Box>
    );
  }

  const displayKm = progress.actualKm ?? planDay.km;
  const isEdited = progress.actualKm != null && progress.actualKm !== planDay.km;

  return (
    <Box
      p={2}
      borderRadius="md"
      bg={progress.completed ? "rgba(5, 150, 105, 0.08)" : "bg.card"}
      border="1px solid"
      borderColor={progress.completed ? "rgba(5, 150, 105, 0.3)" : "border.subtle"}
      minH="70px"
      transition="all 0.15s"
    >
      <HStack justify="space-between" mb={1}>
        <Text fontSize="11px" fontWeight="600" color="text.muted">
          {planDay.day}
        </Text>
        {editingKm ? (
          <Input
            autoFocus
            size="xs"
            type="number"
            step="0.1"
            defaultValue={displayKm}
            w="55px"
            h="20px"
            fontSize="12px"
            fontWeight="700"
            textAlign="right"
            px={1}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) {
                onUpdate({ actualKm: val === planDay.km ? null : val });
              }
              setEditingKm(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingKm(false);
            }}
          />
        ) : (
          <Text
            fontSize="12px"
            fontWeight="700"
            color={COLORS.emerald}
            cursor="pointer"
            onClick={() => setEditingKm(true)}
            title="Click to edit km"
            _hover={{ textDecoration: "underline" }}
          >
            {displayKm}km
            {isEdited && (
              <Text as="span" fontSize="9px" color="text.faint" ml={1}>
                ({planDay.km})
              </Text>
            )}
          </Text>
        )}
      </HStack>

      <Text fontSize="11px" color="text.muted" mb={2} lineHeight="1.3">
        {planDay.description}
      </Text>

      <HStack justify="space-between" align="center" flexWrap="wrap" gap={1}>
        <Box
          as="button"
          onClick={() => onUpdate({ completed: !progress.completed })}
          cursor="pointer"
          fontSize="16px"
          lineHeight="1"
          background="none"
          border="none"
          padding="0"
          opacity={progress.completed ? 1 : 0.3}
          _hover={{ opacity: 0.7 }}
          transition="all 0.15s"
          title={progress.completed ? "Mark incomplete" : "Mark complete"}
        >
          {progress.completed ? "✅" : "⬜"}
        </Box>

        <StarRating
          rating={progress.rating}
          onChange={(rating) => onUpdate({ rating })}
        />

        <HStack gap="2px">
          <NotePopover
            note={progress.note}
            onSave={(note) => onUpdate({ note })}
          />
          <StravaPopover
            url={progress.stravaUrl}
            onSave={(stravaUrl) => onUpdate({ stravaUrl })}
          />
        </HStack>
      </HStack>
    </Box>
  );
}
