import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text, Input } from "@chakra-ui/react";
import type { GoalDistance, RaceType, PlanGeneratorOptions } from "../data/types";
import { generatePlan, EXAMPLE_PLANS } from "../lib/planGenerator";
import { createPlan } from "../lib/supabaseStorage";
import { useColorMode } from "../hooks/useColorMode";
import { SunIcon, MoonIcon } from "../components/Icons";
import { COLORS } from "../theme";

const GOAL_OPTIONS: { value: GoalDistance; label: string; desc: string }[] = [
  { value: "5k", label: "5K", desc: "3.1 miles" },
  { value: "10k", label: "10K", desc: "6.2 miles" },
  { value: "half", label: "Half Marathon", desc: "21.1km" },
  { value: "marathon", label: "Marathon", desc: "42.2km" },
  { value: "50k", label: "50K Ultra", desc: "50km" },
  { value: "100k", label: "100K Ultra", desc: "100km" },
];

const OPTION_LABELS: { key: keyof PlanGeneratorOptions; label: string; desc: string }[] = [
  { key: "deloads", label: "Deload weeks", desc: "Recovery week every 3-4 weeks" },
  { key: "longRuns", label: "Long runs", desc: "Weekly long run on Sunday" },
  { key: "easy", label: "Easy runs", desc: "Z2 aerobic base runs" },
  { key: "strides", label: "Strides", desc: "Short speed bursts after easy runs" },
  { key: "tempo", label: "Tempo runs", desc: "Sustained threshold efforts" },
  { key: "surges", label: "Surges", desc: "Rolling tempo variations" },
  { key: "elevation", label: "Elevation / hills", desc: "Hill repeats and vert" },
  { key: "strength", label: "Strength training", desc: "Cross-training days" },
];

const DEFAULT_OPTIONS: PlanGeneratorOptions = {
  deloads: true,
  strides: true,
  surges: false,
  elevation: false,
  longRuns: true,
  tempo: true,
  easy: true,
  strength: false,
};

export function PlanCreatorPage() {
  const navigate = useNavigate();
  const { colorMode, toggle } = useColorMode();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState<GoalDistance>("half");
  const [raceType, setRaceType] = useState<RaceType>("flat");
  const [targetElevationM, setTargetElevationM] = useState(500);
  const [currentWeeklyKm, setCurrentWeeklyKm] = useState(15);
  const [raceDate, setRaceDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 16 * 7);
    return d.toISOString().split("T")[0];
  });
  const [volumeIncreasePct, setVolumeIncreasePct] = useState(10);
  const [options, setOptions] = useState<PlanGeneratorOptions>(DEFAULT_OPTIONS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOption = (key: keyof PlanGeneratorOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate preview
  const preview = useMemo(() => {
    try {
      return generatePlan({
        goal,
        raceType,
        targetElevationM: raceType === "trail" ? targetElevationM : undefined,
        currentWeeklyKm,
        raceDate,
        volumeIncreasePct,
        options,
      });
    } catch {
      return [];
    }
  }, [goal, raceType, targetElevationM, currentWeeklyKm, raceDate, volumeIncreasePct, options]);

  const peakKm = preview.length > 0 ? Math.max(...preview.map((w) => w.totalKm)) : 0;

  // Count phases
  const phases = preview.reduce<Record<string, number>>((acc, w) => {
    const phase = w.weekType.includes("Cutback") ? "Cutback" : w.weekType;
    acc[phase] = (acc[phase] ?? 0) + 1;
    return acc;
  }, {});

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give your plan a name");
      return;
    }
    if (preview.length === 0) {
      setError("Could not generate a valid plan");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const plan = await createPlan({
        name: name.trim(),
        goal,
        race_type: raceType,
        target_elevation_m: raceType === "trail" ? targetElevationM : null,
        current_weekly_km: currentWeeklyKm,
        race_date: raceDate,
        volume_increase_pct: volumeIncreasePct,
        options,
        weeks: preview,
        status: "draft",
      });
      navigate(`/plans/${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
      setSaving(false);
    }
  }

  function handleUseTemplate(templateId: string) {
    const tmpl = EXAMPLE_PLANS.find((e) => e.id === templateId);
    if (!tmpl) return;
    setName(tmpl.name);
    setGoal(tmpl.config.goal);
    setRaceType(tmpl.config.raceType);
    setCurrentWeeklyKm(tmpl.config.currentWeeklyKm);
    setRaceDate(tmpl.config.raceDate);
    setVolumeIncreasePct(tmpl.config.volumeIncreasePct);
    setOptions(tmpl.config.options);
  }

  return (
    <Box bg="bg.page" minH="100vh" color="text.primary">
      <Box maxW="700px" mx="auto" px={{ base: 3, md: 4 }} pb={12}>
        {/* Header */}
        <Flex justify="space-between" align="center" pt={6} pb={4}>
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
              Create a plan
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

        {/* Templates */}
        <Box mb={6}>
          <Text fontSize="12px" fontWeight="600" color="text.faint" textTransform="uppercase" letterSpacing="0.1em" mb={3}>
            Start from a template
          </Text>
          <Flex gap={3} flexWrap="wrap">
            {EXAMPLE_PLANS.map((tmpl) => (
              <Box
                key={tmpl.id}
                as="button"
                onClick={() => handleUseTemplate(tmpl.id)}
                bg="bg.card"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
                px={4}
                py={3}
                textAlign="left"
                cursor="pointer"
                _hover={{ borderColor: COLORS.emerald }}
                flex="1"
                minW="180px"
              >
                <Text fontSize="13px" fontWeight="700">{tmpl.name}</Text>
                <Text fontSize="11px" color="text.muted" mt="2px">{tmpl.description}</Text>
              </Box>
            ))}
          </Flex>
        </Box>

        {/* Goal */}
        <Section title="Goal distance">
          <Flex gap={2} flexWrap="wrap">
            {GOAL_OPTIONS.map((g) => (
              <SelectCard
                key={g.value}
                selected={goal === g.value}
                onClick={() => setGoal(g.value)}
                label={g.label}
                desc={g.desc}
              />
            ))}
          </Flex>
        </Section>

        {/* Race type */}
        <Section title="Race type">
          <Flex gap={2}>
            <SelectCard selected={raceType === "flat"} onClick={() => setRaceType("flat")} label="Flat" desc="Road race" />
            <SelectCard selected={raceType === "trail"} onClick={() => setRaceType("trail")} label="Trail" desc="Off-road / hills" />
          </Flex>
          {raceType === "trail" && (
            <Box mt={3}>
              <Text fontSize="12px" fontWeight="600" color="text.muted" mb="4px">
                Target elevation gain (metres)
              </Text>
              <Input
                type="number"
                value={targetElevationM}
                onChange={(e) => setTargetElevationM(Number(e.target.value))}
                min={0}
                w="140px"
                size="md"
                bg="bg.page"
                borderColor="border.default"
              />
            </Box>
          )}
        </Section>

        {/* Details */}
        <Section title="Your details">
          <Flex gap={4} flexWrap="wrap">
            <Box flex="1" minW="150px">
              <Text fontSize="12px" fontWeight="600" color="text.muted" mb="4px">
                Race date
              </Text>
              <Input
                type="date"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                w="100%"
                size="md"
                bg="bg.page"
                borderColor="border.default"
              />
            </Box>
            <Box flex="1" minW="150px">
              <Text fontSize="12px" fontWeight="600" color="text.muted" mb="4px">
                Current weekly km
              </Text>
              <Input
                type="number"
                value={currentWeeklyKm}
                onChange={(e) => setCurrentWeeklyKm(Number(e.target.value))}
                min={0}
                w="100%"
                size="md"
                bg="bg.page"
                borderColor="border.default"
              />
            </Box>
          </Flex>
          <Box mt={3}>
            <Text fontSize="12px" fontWeight="600" color="text.muted" mb="4px">
              Volume increase per week: {volumeIncreasePct}%
            </Text>
            <input
              type="range"
              min={5}
              max={15}
              value={volumeIncreasePct}
              onChange={(e) => setVolumeIncreasePct(Number(e.target.value))}
              style={{ width: "100%", maxWidth: "300px", accentColor: COLORS.emerald }}
            />
            <Flex justify="space-between" maxW="300px">
              <Text fontSize="10px" color="text.faint">5% (conservative)</Text>
              <Text fontSize="10px" color="text.faint">15% (aggressive)</Text>
            </Flex>
          </Box>
        </Section>

        {/* Options */}
        <Section title="Plan options">
          <Flex gap={2} flexWrap="wrap">
            {OPTION_LABELS.map((opt) => (
              <Box
                key={opt.key}
                as="button"
                onClick={() => toggleOption(opt.key)}
                bg={options[opt.key] ? "rgba(5, 150, 105, 0.1)" : "bg.card"}
                border="1.5px solid"
                borderColor={options[opt.key] ? COLORS.emerald : "border.subtle"}
                borderRadius="lg"
                px={4}
                py={3}
                textAlign="left"
                cursor="pointer"
                minW="150px"
                flex="1"
                transition="all 0.1s"
              >
                <Text fontSize="13px" fontWeight="700" color={options[opt.key] ? COLORS.emerald : "text.primary"}>
                  {opt.label}
                </Text>
                <Text fontSize="10px" color="text.muted" mt="1px">{opt.desc}</Text>
              </Box>
            ))}
          </Flex>
        </Section>

        {/* Preview */}
        {preview.length > 0 && (
          <Section title="Plan preview">
            <Flex gap={4} flexWrap="wrap" mb={3}>
              <Stat label="Weeks" value={String(preview.length)} />
              <Stat label="Peak volume" value={`${peakKm}km`} />
              <Stat label="Start volume" value={`${preview[0].totalKm}km`} />
            </Flex>
            <Flex gap={1} mb={2}>
              {Object.entries(phases).map(([phase, count]) => (
                <Box
                  key={phase}
                  flex={count}
                  h="8px"
                  borderRadius="full"
                  bg={phaseColor(phase)}
                  title={`${phase}: ${count} weeks`}
                />
              ))}
            </Flex>
            <Flex gap={1} flexWrap="wrap">
              {Object.entries(phases).map(([phase, count]) => (
                <Text key={phase} fontSize="10px" color="text.faint">
                  <Box as="span" display="inline-block" w="8px" h="8px" borderRadius="full" bg={phaseColor(phase)} mr="4px" verticalAlign="middle" />
                  {phase} ({count}w)
                </Text>
              ))}
            </Flex>

            {/* Mini volume chart */}
            <Flex align="flex-end" gap="2px" h="60px" mt={4}>
              {preview.map((w, i) => (
                <Box
                  key={i}
                  flex="1"
                  h={`${peakKm > 0 ? (w.totalKm / peakKm) * 100 : 0}%`}
                  bg={phaseColor(w.weekType)}
                  borderRadius="1px"
                  title={`W${i + 1}: ${w.totalKm}km (${w.weekType})`}
                />
              ))}
            </Flex>
          </Section>
        )}

        {/* Name + Create */}
        <Section title="Name your plan">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Half Marathon Plan"
            w="100%"
            size="md"
            bg="bg.page"
            borderColor="border.default"
            mb={4}
          />

          {error && (
            <Text fontSize="12px" color={COLORS.red} mb={3}>
              {error}
            </Text>
          )}

          <Box
            as="button"
            onClick={() => void handleCreate()}
            w="100%"
            py="12px"
            fontSize="15px"
            fontWeight="700"
            borderRadius="md"
            border="none"
            bg={COLORS.emerald}
            color="white"
            cursor={saving ? "wait" : "pointer"}
            opacity={saving ? 0.7 : 1}
            _hover={{ opacity: 0.9 }}
          >
            {saving ? "Creating..." : `Create ${preview.length}-week plan`}
          </Box>
        </Section>
      </Box>
    </Box>
  );
}

// --- Helper components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box mb={6}>
      <Text fontSize="12px" fontWeight="600" color="text.faint" textTransform="uppercase" letterSpacing="0.1em" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

function SelectCard({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      bg={selected ? "rgba(5, 150, 105, 0.1)" : "bg.card"}
      border="1.5px solid"
      borderColor={selected ? COLORS.emerald : "border.subtle"}
      borderRadius="lg"
      px={4}
      py={3}
      textAlign="center"
      cursor="pointer"
      minW="90px"
      transition="all 0.1s"
    >
      <Text fontSize="15px" fontWeight="800" color={selected ? COLORS.emerald : "text.primary"}>
        {label}
      </Text>
      <Text fontSize="10px" color="text.muted">{desc}</Text>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="10px" color="text.faint" textTransform="uppercase" fontWeight="600">{label}</Text>
      <Text fontSize="18px" fontWeight="800" letterSpacing="-0.02em">{value}</Text>
    </Box>
  );
}

function phaseColor(weekType: string): string {
  if (weekType.includes("Cutback") || weekType.includes("Taper")) return "#10b981";
  if (weekType.includes("Specific") || weekType.includes("Peak")) return "#ef4444";
  if (weekType === "Race Week") return "#d97706";
  if (weekType.includes("Build")) return "#f97316";
  return "#64748b";
}
