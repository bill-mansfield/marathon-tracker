import { useNavigate } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon } from "../components/Icons";
import { COLORS } from "../theme";

const GOAL_CARDS = [
  { label: "5K", desc: "8-12 weeks" },
  { label: "10K", desc: "10-16 weeks" },
  { label: "Half Marathon", desc: "14-20 weeks" },
  { label: "Marathon", desc: "18-26 weeks" },
  { label: "50K Ultra", desc: "20-30 weeks" },
  { label: "100K Ultra", desc: "24-36 weeks" },
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
          <Text fontSize="14px" fontWeight="800" letterSpacing="-0.02em">
            RunPlan
          </Text>
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
                  Sign in
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
                  Get started
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
            Your first marathon plan.
            <br />
            No fluff.
          </Text>
          <Text
            fontSize={{ base: "15px", md: "17px" }}
            color="text.muted"
            maxW="480px"
            mx="auto"
            lineHeight="1.5"
            mb={8}
          >
            Tell RunPlan your goal and where you&apos;re starting from. Get a structured,
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
              onClick={() => navigate("/demo")}
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
        </Box>

        {/* Goal distance cards */}
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
          <Flex gap={3} flexWrap="wrap" justify="center">
            {GOAL_CARDS.map((g) => (
              <Box
                key={g.label}
                bg="bg.card"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
                px={5}
                py={4}
                minW="130px"
                textAlign="center"
              >
                <Text fontSize="18px" fontWeight="800" letterSpacing="-0.02em">
                  {g.label}
                </Text>
                <Text fontSize="11px" color="text.muted" mt="2px">
                  {g.desc}
                </Text>
              </Box>
            ))}
          </Flex>
        </Box>

        {/* Features */}
        <Flex gap={4} flexWrap="wrap" justify="center" mb={12}>
          {[
            { title: "Auto-generated", desc: "Enter your goal and current fitness. The plan builds itself with proper periodization and progressive overload." },
            { title: "Syncs with Strava", desc: "Connect Strava and your completed runs auto-fill into the plan. No manual logging." },
            { title: "Fully customizable", desc: "Control volume increase, toggle deload weeks, strides, tempo runs, hill work, and more." },
          ].map((f) => (
            <Box
              key={f.title}
              flex="1"
              minW="220px"
              maxW="280px"
              bg="bg.card"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={5}
            >
              <Text fontSize="14px" fontWeight="700" mb={1}>
                {f.title}
              </Text>
              <Text fontSize="12px" color="text.muted" lineHeight="1.5">
                {f.desc}
              </Text>
            </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
