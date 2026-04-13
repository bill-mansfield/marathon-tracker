import { useState, useRef, useEffect } from "react";
import { Box, Input, HStack, Link } from "@chakra-ui/react";
import { StravaIcon } from "./Icons";
import { COLORS } from "../theme";

interface StravaPopoverProps {
  url: string;
  onSave: (url: string) => void;
}

export function StravaPopover({ url, onSave }: StravaPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(url);
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

  const hasUrl = url.length > 0;

  return (
    <Box position="relative" display="inline-block" ref={ref}>
      {hasUrl ? (
        <HStack gap="3px">
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            _hover={{ opacity: 0.7 }}
            title="Open in Strava"
            display="flex"
            alignItems="center"
          >
            <StravaIcon linked size={15} />
          </Link>
          <Box
            as="button"
            cursor="pointer"
            opacity={0.4}
            _hover={{ opacity: 0.7 }}
            onClick={() => {
              if (!open) setDraft(url);
              setOpen(!open);
            }}
            background="none"
            border="none"
            padding="0"
            display="flex"
            alignItems="center"
            fontSize="9px"
            color="text.muted"
          >
            edit
          </Box>
        </HStack>
      ) : (
        <Box
          as="button"
          aria-label="Link Strava"
          onClick={() => {
            if (!open) setDraft(url);
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
          <StravaIcon linked={false} size={15} />
        </Box>
      )}
      {open && (
        <Box
          position="absolute"
          top="100%"
          right="0"
          zIndex={100}
          bg="bg.card"
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          p={2}
          shadow="lg"
          w="260px"
          mt={1}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste Strava activity URL"
            size="sm"
            fontSize="13px"
            autoFocus
          />
          <HStack mt={2} justify="flex-end">
            {hasUrl && (
              <Box
                as="button"
                fontSize="12px"
                px={2}
                py={1}
                borderRadius="md"
                bg="#fee2e2"
                color="#991b1b"
                border="none"
                cursor="pointer"
                mr="auto"
                onClick={() => {
                  onSave("");
                  setOpen(false);
                }}
              >
                Remove
              </Box>
            )}
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
              bg={COLORS.strava}
              color="white"
              border="none"
              cursor="pointer"
              onClick={() => {
                onSave(draft.trim());
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
