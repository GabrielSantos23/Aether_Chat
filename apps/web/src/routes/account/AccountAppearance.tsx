import { AccountCard } from "@/components/AccountCard";
import { themes } from "@/components/theme-selector";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

export default function AccountAppearance() {
  const {
    currentTheme,
    currentMode,
    handleThemeChange,
    handleModeChange,
    isLoading,
  } = useTheme();
  const themeOptions = themes;
  const mode = currentMode ?? "dark";

  return (
    <div className="flex flex-col gap-8 w-full">
      <title>Appearance | Aether</title>
      <AccountCard
        title="Mode"
        description="Choose between light and dark mode"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            className={cn(
              "relative p-4 rounded-lg border cursor-pointer transition-all hover:border-foreground/20 text-left w-full bg-muted/50 backdrop-blur-md border-foreground/15",
              currentMode === "light"
                ? "border-primary/50 bg-primary/5"
                : "border-foreground/10 hover:bg-muted/50"
            )}
            onClick={() => handleModeChange("light")}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <SunIcon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Light Mode</div>
                <div className="text-sm text-muted-foreground">
                  Bright interface daytime use
                </div>
              </div>
              {currentMode === "light" && (
                <div className="absolute top-2 right-2">
                  <div className="size-2 bg-primary rounded-full" />
                </div>
              )}
            </div>
          </button>
          <button
            type="button"
            className={cn(
              "relative p-4 rounded-lg border cursor-pointer transition-all hover:border-foreground/20 text-left w-full bg-muted/50 backdrop-blur-md border-foreground/15",
              currentMode === "dark"
                ? "border-primary/50 bg-primary/5"
                : "border-foreground/10 hover:bg-muted/50"
            )}
            onClick={() => handleModeChange("dark")}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <MoonIcon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">
                  Dark interface nighttime use
                </div>
              </div>
              {currentMode === "dark" && (
                <div className="absolute top-2 right-2">
                  <div className="size-2 bg-primary rounded-full" />
                </div>
              )}
            </div>
          </button>
        </div>
      </AccountCard>
      <Separator />
      <AccountCard
        title="Theme"
        description="Choose your preferred visual theme"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeOptions.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={cn(
                "relative p-4 rounded-lg border cursor-pointer transition-all hover:border-foreground/20 text-left w-full bg-background/10 backdrop-blur-md overflow-hidden",
                theme.value === currentTheme
                  ? "border-primary/50 bg-primary/5"
                  : "border-foreground/10 hover:bg-muted/50"
              )}
              onClick={() => handleThemeChange(theme.value)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {theme.description}
                  </div>
                </div>
              </div>
              <div className="flex absolute left-0 right-0 bottom-0">
                <div
                  className={cn(theme.value, mode, "size-4 bg-primary flex-1")}
                />
                <div
                  className={cn(
                    theme.value,
                    mode,
                    "size-4 bg-secondary flex-1"
                  )}
                />
                <div
                  className={cn(theme.value, mode, "size-4 bg-accent flex-1")}
                />
              </div>
            </button>
          ))}
        </div>
      </AccountCard>
    </div>
  );
}
