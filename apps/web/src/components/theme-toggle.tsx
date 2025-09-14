"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeTogglerProps = {
  className?: string;
};

export default function ThemeToggler({ className }: ThemeTogglerProps) {
  const { theme, setTheme } = useTheme();
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Simple function to update boring theme classes
  const updateBoringTheme = (newTheme: string) => {
    try {
      const boringThemeEnabled =
        localStorage.getItem("boring-theme") === "true";
      if (!boringThemeEnabled) return;

      // Remove existing boring theme classes
      document.documentElement.classList.remove("boring-light", "boring-dark");

      // Determine if the new theme is dark
      const isDarkMode =
        newTheme === "dark" ||
        (newTheme === "system" && systemTheme === "dark");

      // Apply the appropriate boring theme class
      document.documentElement.classList.add(
        isDarkMode ? "boring-dark" : "boring-light"
      );
    } catch (error) {
      console.error("Error updating boring theme:", error);
    }
  };

  const switchTheme = () => {
    let newTheme: string;

    switch (theme) {
      case "light":
        newTheme = "dark";
        break;
      case "dark":
        newTheme = "light";
        break;
      case "system":
        newTheme = systemTheme === "light" ? "dark" : "light";
        break;
      default:
        newTheme = "light";
        break;
    }

    setTheme(newTheme);

    // Update boring theme classes if needed
    updateBoringTheme(newTheme);
  };

  const toggleTheme = () => {
    //@ts-ignore
    if (!document.startViewTransition) switchTheme();

    //@ts-ignore
    document.startViewTransition(switchTheme);
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={cn("rounded-2xl cursor-pointer", className)}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
