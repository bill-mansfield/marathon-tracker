import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Text, Flex, Input } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { loadGuestPlan, clearGuestPlan } from "../lib/storage";
import { createPlan } from "../lib/supabaseStorage";
import { generatePlan } from "../lib/planGenerator";
import { COLORS } from "../theme";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      const draft = loadGuestPlan();
      if (draft) {
        try {
          const { name, ...config } = draft;
          const weeks = generatePlan(config);
          const plan = await createPlan({
            name,
            goal: config.goal,
            race_type: config.raceType,
            target_elevation_m: config.raceType === "trail" ? (config.targetElevationM ?? null) : null,
            current_weekly_km: config.currentWeeklyKm,
            race_date: config.raceDate,
            volume_increase_pct: config.volumeIncreasePct,
            options: config.options,
            weeks,
            status: "draft",
          });
          clearGuestPlan();
          navigate(`/plans/${plan.id}`);
        } catch {
          clearGuestPlan();
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    }
  }

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Flex direction="column" align="center" justify="center" minH="100vh" px={4}>
        <Box
          bg="bg.card"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={8}
          w="100%"
          maxW="400px"
        >
          <Text fontSize="24px" fontWeight="800" mb={1} letterSpacing="-0.02em">
            Welcome back
          </Text>
          <Text fontSize="13px" color="text.muted" mb={6}>
            Sign in to your training account
          </Text>

          <form onSubmit={handleSubmit}>
            <Box mb={4}>
              <Text as="label" fontSize="12px" fontWeight="600" color="text.muted" mb="4px" display="block">
                Email
              </Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="md"
                bg="bg.page"
                borderColor="border.default"
                paddingLeft="12px"
              />
            </Box>

            <Box mb={4}>
              <Text as="label" fontSize="12px" fontWeight="600" color="text.muted" mb="4px" display="block">
                Password
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="md"
                bg="bg.page"
                borderColor="border.default"
                paddingLeft="12px"
              />
            </Box>

            {error && (
              <Text fontSize="12px" color={COLORS.red} mb={4}>{error}</Text>
            )}

            <Box
              as="button"
              w="100%"
              py="10px"
              fontSize="14px"
              fontWeight="700"
              borderRadius="md"
              border="none"
              bg={COLORS.emerald}
              color="white"
              cursor={loading ? "wait" : "pointer"}
              opacity={loading ? 0.7 : 1}
              _hover={{ opacity: 0.9 }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Box>
          </form>

          <Text fontSize="13px" color="text.muted" mt={4} textAlign="center">
            Don't have an account?{" "}
            <RouterLink to="/signup" style={{ color: COLORS.emerald, fontWeight: 600 }}>
              Sign up
            </RouterLink>
          </Text>

          <Text fontSize="12px" color="text.faint" mt={3} textAlign="center">
            <RouterLink to="/demo" style={{ textDecoration: "underline" }}>
              Try the demo
            </RouterLink>{" "}
            without an account
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
