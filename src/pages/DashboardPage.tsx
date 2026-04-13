import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import type { TrainingPlan } from "../data/types";
import { fetchUserPlans, deletePlan, createPlan, importPlanProgress } from "../lib/supabaseStorage";
import { importPlanJson } from "../lib/storage";
import { useAuth } from "../hooks/useAuth";
import { PlanCard } from "../components/PlanCard";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon } from "../components/Icons";
import { COLORS } from "../theme";

export function DashboardPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { colorMode, toggle } = useColorMode();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    try {
      const data = await fetchUserPlans();
      setPlans(data);
    } catch {
      // silently fail — empty state is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleDelete = useCallback(
    async (planId: string) => {
      if (!confirm("Delete this plan? This cannot be undone.")) return;
      await deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    },
    []
  );

  const handleImportPlan = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const imported = await importPlanJson(file);
      if (!imported) return;
      const { plan: importedPlan, progress: importedProgress } = imported;
      const newPlan = await createPlan({
        name: importedPlan.name,
        goal: importedPlan.goal,
        race_type: importedPlan.race_type,
        target_elevation_m: importedPlan.target_elevation_m,
        current_weekly_km: importedPlan.current_weekly_km,
        race_date: importedPlan.race_date,
        volume_increase_pct: importedPlan.volume_increase_pct,
        options: importedPlan.options,
        weeks: importedPlan.weeks,
        status: importedPlan.status,
      });
      await importPlanProgress(newPlan.id, importedProgress);
      navigate(`/plans/${newPlan.id}`);
    };
    input.click();
  }, [navigate]);

  const inProgress = plans.filter((p) => p.status === "in_progress");
  const drafts = plans.filter((p) => p.status === "draft");
  const completed = plans.filter((p) => p.status === "completed");

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="900px" mx="auto" px={{ base: 3, md: 4 }} pb={8}>
        {/* Header */}
        <Flex justify="space-between" align="center" pt={6} pb={6}>
          <Box>
            <Text
              fontSize="10px"
              fontWeight="600"
              letterSpacing="0.12em"
              color="text.faint"
              textTransform="uppercase"
              mb="2px"
            >
              Training Plans
            </Text>
            <Text
              fontSize={{ base: "22px", md: "28px" }}
              fontWeight="800"
              letterSpacing="-0.02em"
            >
              Dashboard
            </Text>
          </Box>
          <Flex gap={2} align="center">
            <Box
              as="button"
              onClick={handleImportPlan}
              fontSize="13px"
              fontWeight="700"
              px={4}
              py="9px"
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="bg.card"
              color="text.primary"
              cursor="pointer"
              _hover={{ borderColor: COLORS.emerald, color: COLORS.emerald }}
            >
              Import plan
            </Box>
            <Box
              as="button"
              onClick={() => navigate("/plans/new")}
              fontSize="13px"
              fontWeight="700"
              px={4}
              py="9px"
              borderRadius="md"
              border="none"
              bg={COLORS.emerald}
              color="white"
              cursor="pointer"
              _hover={{ opacity: 0.9 }}
            >
              + New plan
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
              _hover={{ bg: "bg.muted", color: "text.primary" }}
              display="flex"
              alignItems="center"
            >
              {colorMode === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </Box>
            <Box
              as="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              fontSize="12px"
              fontWeight="600"
              color="text.muted"
              background="none"
              border="none"
              cursor="pointer"
              _hover={{ color: "text.primary" }}
            >
              Sign out
            </Box>
          </Flex>
        </Flex>

        {loading ? (
          <Text color="text.muted" textAlign="center" mt={12}>
            Loading your plans...
          </Text>
        ) : plans.length === 0 ? (
          <Box
            textAlign="center"
            py={16}
            bg="bg.card"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
          >
            <Text fontSize="18px" fontWeight="700" mb={2}>
              No training plans yet
            </Text>
            <Text fontSize="13px" color="text.muted" mb={6}>
              Create your first plan to start training
            </Text>
            <Box
              as="button"
              onClick={() => navigate("/plans/new")}
              fontSize="14px"
              fontWeight="700"
              px={6}
              py="10px"
              borderRadius="md"
              border="none"
              bg={COLORS.emerald}
              color="white"
              cursor="pointer"
              _hover={{ opacity: 0.9 }}
            >
              Create a plan
            </Box>
          </Box>
        ) : (
          <Box>
            {inProgress.length > 0 && (
              <Box mb={6}>
                <Text fontSize="12px" fontWeight="600" color="text.muted" mb={3} letterSpacing="0.02em">
                  In Progress
                </Text>
                <Flex direction="column" gap={3}>
                  {inProgress.map((p) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      onClick={() => navigate(`/plans/${p.id}`)}
                      onDelete={() => void handleDelete(p.id)}
                    />
                  ))}
                </Flex>
              </Box>
            )}

            {drafts.length > 0 && (
              <Box mb={6}>
                <Text fontSize="12px" fontWeight="600" color="text.muted" mb={3} letterSpacing="0.02em">
                  Drafts
                </Text>
                <Flex direction="column" gap={3}>
                  {drafts.map((p) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      onClick={() => navigate(`/plans/${p.id}`)}
                      onDelete={() => void handleDelete(p.id)}
                    />
                  ))}
                </Flex>
              </Box>
            )}

            {completed.length > 0 && (
              <Box mb={6}>
                <Text fontSize="12px" fontWeight="600" color="text.muted" mb={3} letterSpacing="0.02em">
                  Completed
                </Text>
                <Flex direction="column" gap={3}>
                  {completed.map((p) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      onClick={() => navigate(`/plans/${p.id}`)}
                      onDelete={() => void handleDelete(p.id)}
                    />
                  ))}
                </Flex>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
