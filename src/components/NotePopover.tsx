import { useState, useRef, useEffect } from "react";
import { Box, Textarea, HStack, IconButton } from "@chakra-ui/react";

interface NotePopoverProps {
  note: string;
  onSave: (note: string) => void;
}

export function NotePopover({ note, onSave }: NotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(note);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(note);
  }, [open, note]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasNote = note.length > 0;

  return (
    <Box position="relative" display="inline-block" ref={ref}>
      <IconButton
        aria-label="Add note"
        size="xs"
        variant="ghost"
        onClick={() => setOpen(!open)}
        opacity={hasNote ? 1 : 0.35}
        _hover={{ opacity: 0.7 }}
        fontSize="14px"
        minW="auto"
        h="auto"
        p="2px"
      >
        {hasNote ? "📝" : "💬"}
      </IconButton>
      {open && (
        <Box
          position="absolute"
          top="100%"
          left="50%"
          transform="translateX(-50%)"
          zIndex={10}
          bg="bg.card"
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          p={2}
          shadow="lg"
          w="220px"
          mt={1}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="How did it go?"
            size="sm"
            rows={3}
            autoFocus
            fontSize="13px"
          />
          <HStack mt={2} justify="flex-end">
            <Box
              as="button"
              fontSize="12px"
              px={2}
              py={1}
              borderRadius="md"
              bg="bg.muted"
              color="text.muted"
              border="none"
              cursor="pointer"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Box>
            <Box
              as="button"
              fontSize="12px"
              px={2}
              py={1}
              borderRadius="md"
              bg="#059669"
              color="white"
              border="none"
              cursor="pointer"
              onClick={() => {
                onSave(draft);
                setOpen(false);
              }}
            >
              Save
            </Box>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
