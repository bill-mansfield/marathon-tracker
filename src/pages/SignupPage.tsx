import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Text, Flex, Input } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../theme";

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
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
            textAlign="center"
          >
            <Text fontSize="24px" fontWeight="800" mb={2}>Check your email</Text>
            <Text fontSize="13px" color="text.muted" mb={4}>
              We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
            </Text>
            <Box
              as="button"
              onClick={() => navigate("/login")}
              px={6}
              py="10px"
              fontSize="14px"
              fontWeight="700"
              borderRadius="md"
              border="none"
              bg={COLORS.emerald}
              color="white"
              cursor="pointer"
              _hover={{ opacity: 0.9 }}
            >
              Go to login
            </Box>
          </Box>
        </Flex>
      </Box>
    );
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
            Create an account
          </Text>
          <Text fontSize="13px" color="text.muted" mb={6}>
            Start building your training plan
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
                minLength={6}
                size="md"
                bg="bg.page"
                borderColor="border.default"
              />
              <Text fontSize="11px" color="text.faint" mt="2px">
                Must be at least 6 characters
              </Text>
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
              {loading ? "Creating account..." : "Create account"}
            </Box>
          </form>

          <Text fontSize="13px" color="text.muted" mt={4} textAlign="center">
            Already have an account?{" "}
            <RouterLink to="/login" style={{ color: COLORS.emerald, fontWeight: 600 }}>
              Sign in
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
