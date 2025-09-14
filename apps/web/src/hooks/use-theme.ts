import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "app-theme";
const MODE_STORAGE_KEY = "app-mode";

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [currentMode, setCurrentMode] = useState<"light" | "dark">("dark");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme and mode from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "default";
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as
      | "light"
      | "dark"
      | null;
    const mode =
      savedMode === "light" || savedMode === "dark" ? savedMode : "dark";

    setCurrentTheme(savedTheme);
    setCurrentMode(mode);
    applyThemeToDocument(savedTheme, mode);
    setIsLoading(false);
  }, []);

  const applyThemeToDocument = (theme: string, mode: "light" | "dark") => {
    document.documentElement.classList.remove(
      "default",
      "t3-chat",
      "claymorphism",
      "claude",
      "graphite",
      "amethyst-haze",
      "vercel"
    );
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme, mode);
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    applyThemeToDocument(theme, currentMode);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  const handleModeChange = (mode: "light" | "dark") => {
    setCurrentMode(mode);
    applyThemeToDocument(currentTheme, mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  return {
    currentTheme,
    currentMode,
    handleThemeChange,
    handleModeChange,
    isLoading,
  };
}
