import { HStack, Box } from "@chakra-ui/react";
import { StarIcon } from "./Icons";

interface StarRatingProps {
  rating: 0 | 1 | 2 | 3;
  onChange: (rating: 0 | 1 | 2 | 3) => void;
}

export function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <HStack gap="1px">
      {([1, 2, 3] as const).map((star) => (
        <Box
          key={star}
          as="button"
          onClick={() => onChange(rating === star ? 0 : star)}
          cursor="pointer"
          display="flex"
          alignItems="center"
          _hover={{ transform: "scale(1.15)" }}
          transition="transform 0.1s"
          background="none"
          border="none"
          padding="1px"
        >
          <StarIcon filled={star <= rating} size={13} />
        </Box>
      ))}
    </HStack>
  );
}
