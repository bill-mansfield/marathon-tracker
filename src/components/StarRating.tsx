import { HStack, Box } from "@chakra-ui/react";
import { COLORS } from "../theme";

interface StarRatingProps {
  rating: 0 | 1 | 2 | 3;
  onChange: (rating: 0 | 1 | 2 | 3) => void;
}

export function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <HStack gap="2px">
      {([1, 2, 3] as const).map((star) => (
        <Box
          key={star}
          as="button"
          onClick={() => onChange(rating === star ? 0 : star)}
          cursor="pointer"
          fontSize="16px"
          lineHeight="1"
          color={star <= rating ? COLORS.star : undefined}
          opacity={star <= rating ? 1 : 0.25}
          _hover={{ opacity: 0.7 }}
          transition="all 0.15s"
          background="none"
          border="none"
          padding="0"
        >
          ★
        </Box>
      ))}
    </HStack>
  );
}
