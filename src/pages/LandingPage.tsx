import { useNavigate } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon, StravaIcon, BuildWeeksLogo } from "../components/Icons";
import { COLORS } from "../theme";

const GOAL_DISTANCES = [
  { label: "5K", desc: "8–12 weeks" },
  { label: "10K", desc: "10–16 weeks" },
  { label: "Half Marathon", desc: "14–20 weeks" },
  { label: "Marathon", desc: "18–26 weeks" },
  { label: "50K Ultra", desc: "20–30 weeks" },
  { label: "100K Ultra", desc: "24–36 weeks" },
];

const FEATURES = [
  {
    title: "Auto-generated",
    desc: "Enter your goal and current fitness. The plan builds itself with proper periodization and progressive overload.",
  },
  {
    title: "Syncs with Strava",
    desc: "Connect Strava and your completed runs auto-fill into the plan. No manual logging.",
    strava: true,
  },
  {
    title: "Fully customizable",
    desc: "Control volume increase, toggle deload weeks, strides, tempo runs, hill work, and more.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colorMode, toggle } = useColorMode();

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="800px" mx="auto" px={{ base: 3, md: 4 }} pb={12}>
        {/* Nav */}
        <Flex justify="space-between" align="center" pt={6} pb={2}>
          <BuildWeeksLogo iconSize={18} />
          <Flex gap={2} align="center">
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
              {colorMode === "light" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </Box>
            {user ? (
              <Box
                as="button"
                onClick={() => navigate("/dashboard")}
                fontSize="13px"
                fontWeight="700"
                px={4}
                py="8px"
                borderRadius="md"
                border="none"
                bg={COLORS.emerald}
                color="white"
                cursor="pointer"
                _hover={{ opacity: 0.9 }}
              >
                Dashboard
              </Box>
            ) : (
              <Flex gap={2}>
                <Box
                  as="button"
                  onClick={() => navigate("/login")}
                  fontSize="13px"
                  fontWeight="600"
                  px={3}
                  py="8px"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="border.default"
                  bg="bg.card"
                  color="text.primary"
                  cursor="pointer"
                  _hover={{ borderColor: "text.muted" }}
                >
                  Log in
                </Box>
                <Box
                  as="button"
                  onClick={() => navigate("/signup")}
                  fontSize="13px"
                  fontWeight="700"
                  px={4}
                  py="8px"
                  borderRadius="md"
                  border="none"
                  bg={COLORS.emerald}
                  color="white"
                  cursor="pointer"
                  _hover={{ opacity: 0.9 }}
                >
                  Sign up
                </Box>
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Hero */}
        <Box textAlign="center" pt={{ base: 12, md: 20 }} pb={10}>
          <Text
            fontSize={{ base: "32px", md: "48px" }}
            fontWeight="800"
            lineHeight="1.1"
            letterSpacing="-0.03em"
            mb={4}
          >
            The easiest marathon planner
          </Text>
          <Text
            fontSize={{ base: "15px", md: "17px" }}
            color="text.muted"
            maxW="480px"
            mx="auto"
            lineHeight="1.5"
            mb={8}
          >
            Tell BuildWeeks your goal and where you&apos;re starting from. Get a structured,
            week-by-week training plan in seconds — with Strava sync built in.
          </Text>
          <Flex gap={3} justify="center" flexWrap="wrap">
            <Box
              as="button"
              onClick={() => navigate(user ? "/plans/new" : "/signup")}
              fontSize="15px"
              fontWeight="700"
              px={6}
              py="12px"
              borderRadius="md"
              border="none"
              bg={COLORS.emerald}
              color="white"
              cursor="pointer"
              _hover={{ opacity: 0.9 }}
            >
              Create a plan
            </Box>
            <Box
              as="button"
              onClick={() => navigate("/plans/new")}
              fontSize="15px"
              fontWeight="600"
              px={6}
              py="12px"
              borderRadius="md"
              border="1px solid"
              borderColor="border.default"
              bg="bg.card"
              color="text.primary"
              cursor="pointer"
              _hover={{ borderColor: "text.muted" }}
            >
              Try the demo
            </Box>
          </Flex>
          <Flex justify="center" align="center" gap={2} mt={4}>
            <StravaIcon linked size={16} />
            <Text fontSize="12px" color="text.muted">
              Syncs with Strava
            </Text>
          </Flex>
        </Box>

        {/* Goal distances */}
        <Box mb={12}>
          <Text
            fontSize="12px"
            fontWeight="600"
            color="text.faint"
            textTransform="uppercase"
            letterSpacing="0.1em"
            textAlign="center"
            mb={4}
          >
            Plans for every distance
          </Text>
          <Box maxW="480px" mx="auto">
            {GOAL_DISTANCES.map((g) => (
              <Flex
                key={g.label}
                justify="space-between"
                align="baseline"
                py="10px"
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Text fontSize="16px" fontWeight="700">
                  {g.label}
                </Text>
                <Text fontSize="12px" color="text.faint">
                  {g.desc}
                </Text>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Features */}
        <Box maxW="520px" mx="auto" mb={12}>
          {FEATURES.map((f, i) => (
            <Flex key={f.title} gap={5} mb={8} align="flex-start">
              <Text
                fontSize="11px"
                fontWeight="700"
                color="text.faint"
                minW="28px"
                pt="2px"
              >
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Box>
                {f.strava ? (
                  <Flex align="center" gap={2} fontSize="15px" fontWeight="700" mb="4px">
                    <Text fontSize="15px" fontWeight="700">{f.title}</Text>
                    <StravaIcon linked size={14} />
                  </Flex>
                ) : (
                  <Text fontSize="15px" fontWeight="700" mb="4px">
                    {f.title}
                  </Text>
                )}
                <Text fontSize="13px" color="text.muted" lineHeight="1.6">
                  {f.desc}
                </Text>
              </Box>
            </Flex>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
