import { useState, useEffect } from "react";

export function useColorMode() {
  const [colorMode, setMode] = useState<"light" | "dark">(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("marathon-color-mode")
        : null;
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = colorMode;
    html.classList.toggle("dark", colorMode === "dark");
    localStorage.setItem("marathon-color-mode", colorMode);
  }, [colorMode]);

  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  return { colorMode, toggle };
}
