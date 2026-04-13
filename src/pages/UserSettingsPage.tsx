import { useNavigate } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon } from "../components/Icons";
import { COLORS } from "../theme";

export function UserSettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { colorMode, toggle } = useColorMode();

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="600px" mx="auto" px={{ base: 3, md: 4 }} pb={8}>
        <Flex justify="space-between" align="center" pt={6} pb={6}>
          <Box>
            <Box
              as="button"
              onClick={() => navigate("/dashboard")}
              fontSize="12px"
              fontWeight="600"
              color="text.muted"
              background="none"
              border="none"
              cursor="pointer"
              mb="4px"
              _hover={{ color: "text.primary" }}
            >
              &larr; Dashboard
            </Box>
            <Text fontSize="22px" fontWeight="800" letterSpacing="-0.02em">
              Settings
            </Text>
          </Box>
          <Box
            as="button"
            onClick={toggle}
            background="none"
            border="none"
            cursor="pointer"
            p="6px"
            borderRadius="md"
            color="text.muted"
            _hover={{ bg: "bg.muted" }}
            display="flex"
            alignItems="center"
          >
            {colorMode === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </Box>
        </Flex>

        {/* Account */}
        <Box
          bg="bg.card"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={5}
          mb={4}
        >
          <Text fontSize="13px" fontWeight="700" mb={3}>
            Account
          </Text>
          <Text fontSize="13px" color="text.muted">
            {user?.email}
          </Text>
        </Box>

        {/* Strava (placeholder) */}
        <Box
          bg="bg.card"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={5}
          mb={4}
        >
          <Text fontSize="13px" fontWeight="700" mb={2}>
            Strava Integration
          </Text>
          <Text fontSize="12px" color="text.muted" mb={3}>
            Connect your Strava account to automatically sync activities to your
            training plan.
          </Text>
          <Box
            as="button"
            fontSize="13px"
            fontWeight="700"
            px={4}
            py="8px"
            borderRadius="md"
            border="none"
            bg={COLORS.strava}
            color="white"
            cursor="pointer"
            opacity={0.5}
            title="Coming soon"
          >
            Connect Strava (coming soon)
          </Box>
        </Box>

        {/* Sign out */}
        <Box
          as="button"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          fontSize="13px"
          fontWeight="600"
          color={COLORS.red}
          background="none"
          border="none"
          cursor="pointer"
          _hover={{ textDecoration: "underline" }}
        >
          Sign out
        </Box>
      </Box>
    </Box>
  );
}
