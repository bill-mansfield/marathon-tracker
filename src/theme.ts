import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        "bg.page": { value: { base: "#f8f6f3", _dark: "#17140f" } },
        "bg.card": { value: { base: "#ffffff", _dark: "#201c17" } },
        "bg.muted": { value: { base: "#f0ebe4", _dark: "#2a2420" } },
        "bg.subtle": { value: { base: "#e8e0d6", _dark: "#352e28" } },
        "text.primary": { value: { base: "#1a1410", _dark: "#f3ede4" } },
        "text.muted": { value: { base: "#6b6459", _dark: "#c4b8ac" } },
        "text.faint": { value: { base: "#a89f95", _dark: "#7a6e65" } },
        "border.default": { value: { base: "#d9cfc2", _dark: "#3a3228" } },
        "border.subtle": { value: { base: "#ede6db", _dark: "#2a2420" } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

export const COLORS = {
  emerald: "#059669",
  emeraldLight: "#d1fae5",
  amber: "#d97706",
  star: "#d97706",
  red: "#dc2626",
  gold: "#ca8a04",
  slate: "#64748b",
  sky: "#0ea5e9",
  strava: "#fc4c02",
  chartPlanned: "#d9cfc2",
  chartActual: "#059669",
  chartGrid: "#e8e0d6",
};

export const WEEK_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Base: { bg: "#e2e8f0", text: "#475569" },
  "Base + Strides": { bg: "#e2e8f0", text: "#475569" },
  "Base Build": { bg: "#fef3c7", text: "#92400e" },
  "Base Peak": { bg: "#fef3c7", text: "#92400e" },
  Cutback: { bg: "#d1fae5", text: "#065f46" },
  Transition: { bg: "#dbeafe", text: "#1e40af" },
  Build: { bg: "#ffedd5", text: "#9a3412" },
  Absorption: { bg: "#d1fae5", text: "#065f46" },
  Specific: { bg: "#fee2e2", text: "#991b1b" },
  Peak: { bg: "#fee2e2", text: "#991b1b" },
  "Wind Down": { bg: "#d1fae5", text: "#065f46" },
  "Early Taper": { bg: "#d1fae5", text: "#065f46" },
  Taper: { bg: "#d1fae5", text: "#065f46" },
  "Race Week": { bg: "#fef9c3", text: "#854d0e" },
};
