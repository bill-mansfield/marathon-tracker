import { useState, useRef, useEffect } from "react";
import { Box, Textarea, HStack } from "@chakra-ui/react";
import { NoteIcon } from "./Icons";

interface NotePopoverProps {
  note: string;
  onSave: (note: string) => void;
}

export function NotePopover({ note, onSave }: NotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(note);
  const ref = useRef<HTMLDivElement>(null);

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
      <Box
        as="button"
        aria-label="Add note"
        onClick={() => {
          if (!open) setDraft(note);
          setOpen(!open);
        }}
        _hover={{ opacity: 0.7 }}
        background="none"
        border="none"
        cursor="pointer"
        display="flex"
        alignItems="center"
        p="2px"
      >
        <NoteIcon hasNote={hasNote} size={15} />
      </Box>
      {open && (
        <Box
          position="absolute"
          top="100%"
          left="50%"
          transform="translateX(-50%)"
          zIndex={100}
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
