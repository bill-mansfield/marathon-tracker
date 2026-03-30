import { useState } from "react";
import { Box, HStack, Text, Input, Flex } from "@chakra-ui/react";
import type { PlanDay, RunProgress } from "../data/types";
import { StarRating } from "./StarRating";
import { NotePopover } from "./NotePopover";
import { StravaPopover } from "./StravaPopover";
import { CheckboxIcon, PencilIcon } from "./Icons";
import { COLORS } from "../theme";
import { isRestDay } from "../lib/utils";

interface DayCellProps {
  planDay: PlanDay;
  progress: RunProgress;
  onUpdate: (patch: Partial<RunProgress>) => void;
  compact?: boolean;
}

const DEFAULT_PROGRESS: RunProgress = {
  completed: false,
  rating: 0,
  note: "",
  stravaUrl: "",
  actualKm: null,
};

export function DayCell({ planDay, progress = DEFAULT_PROGRESS, onUpdate, compact }: DayCellProps) {
  const [editingKm, setEditingKm] = useState(false);
  const rest = isRestDay(planDay.description, planDay.km);

  // Compact rest day — just a thin label
  if (rest) {
    if (compact) return null; // hide on mobile
    return (
      <Flex
        align="center"
        justify="center"
        borderRadius="md"
        bg="bg.muted"
        opacity={0.4}
        py={1}
        minH="28px"
      >
        <Text fontSize="10px" fontWeight="600" color="text.faint" letterSpacing="0.03em">
          {planDay.day}
        </Text>
      </Flex>
    );
  }

  const displayKm = progress.actualKm ?? planDay.km;
  const isEdited = progress.actualKm != null && progress.actualKm !== planDay.km;

  return (
    <Box
      p={2}
      borderRadius="md"
      bg={progress.completed ? "rgba(5, 150, 105, 0.06)" : "bg.card"}
      border="1px solid"
      borderColor={progress.completed ? "rgba(5, 150, 105, 0.25)" : "border.subtle"}
      transition="all 0.15s"
      position="relative"
    >
      <HStack justify="space-between" mb={1}>
        <Text fontSize="10px" fontWeight="700" color="text.faint" letterSpacing="0.05em">
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
            borderColor="border.default"
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
          <HStack
            gap="3px"
            cursor="pointer"
            onClick={() => setEditingKm(true)}
            title="Click to edit distance"
            role="group"
            css={{
              "& .pencil": { opacity: 0, transition: "opacity 0.15s" },
              "&:hover .pencil": { opacity: 0.5 },
            }}
          >
            <Text fontSize="13px" fontWeight="700" color={COLORS.emerald} lineHeight="1">
              {displayKm}
              <Text as="span" fontSize="10px" fontWeight="500">km</Text>
            </Text>
            {isEdited && (
              <Text fontSize="9px" color="text.faint">
                ({planDay.km})
              </Text>
            )}
            <Box className="pencil" color="text.faint">
              <PencilIcon size={9} />
            </Box>
          </HStack>
        )}
      </HStack>

      <Text fontSize="11px" color="text.muted" mb={2} lineHeight="1.3">
        {planDay.description}
      </Text>

      <HStack justify="space-between" align="center" gap={1}>
        <Box
          as="button"
          onClick={() => onUpdate({ completed: !progress.completed })}
          cursor="pointer"
          background="none"
          border="none"
          padding="0"
          display="flex"
          alignItems="center"
          _hover={{ opacity: 0.7 }}
          transition="all 0.15s"
          title={progress.completed ? "Mark incomplete" : "Mark complete"}
        >
          <CheckboxIcon checked={progress.completed} size={18} />
        </Box>

        <StarRating
          rating={progress.rating}
          onChange={(rating) => onUpdate({ rating })}
        />

        <HStack gap="4px">
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
