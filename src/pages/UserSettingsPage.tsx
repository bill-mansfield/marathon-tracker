import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon } from "../components/Icons";
import { COLORS } from "../theme";
import { getStravaProfile, disconnectStrava } from "../lib/stravaSync";
import { supabase } from "../lib/supabase";

export function UserSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { colorMode, toggle } = useColorMode();

  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaAthleteName, setStravaAthleteName] = useState<string | undefined>();
  const [stravaLoading, setStravaLoading] = useState(false);
  const [stravaError, setStravaError] = useState<string | null>(null);

  // Load Strava connection status on mount
  useEffect(() => {
    void getStravaProfile().then(({ connected, athleteName }) => {
      setStravaConnected(connected);
      setStravaAthleteName(athleteName);
    });
  }, []);

  // Handle redirect back from Strava OAuth
  useEffect(() => {
    if (searchParams.get("stravaConnected") === "true") {
      void getStravaProfile().then(({ connected, athleteName }) => {
        setStravaConnected(connected);
        setStravaAthleteName(athleteName);
      });
    }
    if (searchParams.get("stravaError")) {
      setStravaError("Strava connection failed. Please try again.");
    }
  }, [searchParams]);

  async function handleConnectStrava() {
    if (!supabase) return;
    setStravaLoading(true);
    setStravaError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/strava-connect`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to initiate Strava connection");
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (err) {
      setStravaError(err instanceof Error ? err.message : "Something went wrong");
      setStravaLoading(false);
    }
  }

  async function handleDisconnectStrava() {
    setStravaLoading(true);
    await disconnectStrava();
    setStravaConnected(false);
    setStravaAthleteName(undefined);
    setStravaLoading(false);
  }

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

        {/* Strava */}
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
            Connect your Strava account to automatically sync completed runs to your training plan.
          </Text>

          {stravaConnected ? (
            <Flex align="center" gap={3} flexWrap="wrap">
              <Box
                borderRadius="md"
                bg="rgba(5, 150, 105, 0.08)"
                border="1px solid"
                borderColor="rgba(5, 150, 105, 0.3)"
                px={3}
                py="6px"
              >
                <Text fontSize="12px" fontWeight="600" color={COLORS.emerald}>
                  Connected{stravaAthleteName ? ` as ${stravaAthleteName}` : ""}
                </Text>
              </Box>
              <Box
                as="button"
                fontSize="12px"
                fontWeight="600"
                color="text.faint"
                background="none"
                border="none"
                cursor={stravaLoading ? "wait" : "pointer"}
                opacity={stravaLoading ? 0.5 : 1}
                _hover={{ color: COLORS.red }}
                onClick={() => void handleDisconnectStrava()}
              >
                Disconnect
              </Box>
            </Flex>
          ) : (
            <Box>
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
                cursor={stravaLoading ? "wait" : "pointer"}
                opacity={stravaLoading ? 0.7 : 1}
                _hover={{ opacity: 0.9 }}
                onClick={() => void handleConnectStrava()}
              >
                {stravaLoading ? "Connecting..." : "Connect Strava"}
              </Box>
              {stravaError && (
                <Text fontSize="12px" color={COLORS.red} mt={2}>
                  {stravaError}
                </Text>
              )}
            </Box>
          )}
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
