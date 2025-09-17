"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark";
type SidebarVariant = "inset" | "sidebar" | "floating";

type ThemeContextValue = {
  currentTheme: string;
  currentMode: ThemeMode;
  sidebarVariant: SidebarVariant;
  isLoading: boolean;
  handleThemeChange: (theme: string) => void;
  handleModeChange: (mode: ThemeMode) => void;
  handleSidebarVariantChange: (variant: SidebarVariant) => void;
};

const THEME_STORAGE_KEY = "app-theme";
const MODE_STORAGE_KEY = "app-mode";
const SIDEBAR_VARIANT_STORAGE_KEY = "sidebar-variant";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<string>("default");
  const [currentMode, setCurrentMode] = useState<ThemeMode>("dark");
  const [sidebarVariant, setSidebarVariant] =
    useState<SidebarVariant>("sidebar");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "default";
    const savedMode =
      (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null) ?? null;
    const savedSidebarVariant =
      (localStorage.getItem(
        SIDEBAR_VARIANT_STORAGE_KEY
      ) as SidebarVariant | null) ?? null;

    const mode =
      savedMode === "light" || savedMode === "dark" ? savedMode : "dark";
    const variant: SidebarVariant =
      savedSidebarVariant === "inset" ||
      savedSidebarVariant === "sidebar" ||
      savedSidebarVariant === "floating"
        ? savedSidebarVariant
        : "sidebar";

    setCurrentTheme(savedTheme);
    setCurrentMode(mode);
    setSidebarVariant(variant);
    applyThemeToDocument(savedTheme, mode);
    setIsLoading(false);
  }, []);

  const applyThemeToDocument = (theme: string, mode: ThemeMode) => {
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

  const handleModeChange = (mode: ThemeMode) => {
    setCurrentMode(mode);
    applyThemeToDocument(currentTheme, mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  const handleSidebarVariantChange = (variant: SidebarVariant) => {
    setSidebarVariant(variant);
    localStorage.setItem(SIDEBAR_VARIANT_STORAGE_KEY, variant);
  };

  const value: ThemeContextValue = useMemo(
    () => ({
      currentTheme,
      currentMode,
      sidebarVariant,
      isLoading,
      handleThemeChange,
      handleModeChange,
      handleSidebarVariantChange,
    }),
    [currentTheme, currentMode, sidebarVariant, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useAppThemeContext must be used within AppThemeProvider");
  return ctx;
}
