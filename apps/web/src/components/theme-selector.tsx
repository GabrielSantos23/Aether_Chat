"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { MoonIcon, PaintBucket, SunIcon } from "lucide-react";
import { useState } from "react";

export const themes = [
  {
    name: "Default",
    value: "default",
    description: "Clean and minimal design",
  },
  {
    name: "T3 Chat",
    value: "t3-chat",
    description: "Modern chat interface style",
  },
  {
    name: "Claymorphism",
    value: "claymorphism",
    description: "Soft, clay-like appearance",
  },
  {
    name: "Claude",
    value: "claude",
    description: "Anthropic's Claude-inspired theme",
  },
  {
    name: "Graphite",
    value: "graphite",
    description: "Dark and sophisticated",
  },
  {
    name: "Amethyst Haze",
    value: "amethyst-haze",
    description: "Purple-tinted aesthetic",
  },
  {
    name: "Vercel",
    value: "vercel",
    description: "Vercel-inspired design",
  },
];

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const {
    currentTheme,
    currentMode,
    handleThemeChange,
    handleModeChange,
    isLoading,
  } = useTheme();

  if (isLoading) {
    return (
      <Button variant="outline" size="icon" disabled>
        <PaintBucket className="size-4" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-expanded={open}>
          <PaintBucket className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 bg-background/50 border-foreground/10 backdrop-blur-md overflow-hidden w-[250px]"
        align="end"
      >
        <Command>
          <CommandInput placeholder="Search theme..." className="h-9" />
          <CommandList>
            <CommandEmpty>No theme found.</CommandEmpty>
            <CommandGroup heading="Mode">
              <CommandItem
                value="light"
                className="data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground"
                onSelect={() => handleModeChange("light")}
              >
                <SunIcon className="size-4" />
                <span>Light</span>
                <div className="flex-1" />
                {currentMode === "light" && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
              </CommandItem>
              <CommandItem
                value="dark"
                className="data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground"
                onSelect={() => handleModeChange("dark")}
              >
                <MoonIcon className="size-4" />
                <span>Dark</span>
                <div className="flex-1" />
                {currentMode === "dark" && (
                  <span className="text-xs text-muted-foreground">
                    Selected
                  </span>
                )}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              {themes.map((themeOption) => (
                <CommandItem
                  key={themeOption.value}
                  value={themeOption.name}
                  className="data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground"
                  onSelect={() => handleThemeChange(themeOption.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className={cn(
                          themeOption.value,
                          currentMode,
                          "size-3 rounded-[3px] bg-primary"
                        )}
                      />
                      <div
                        className={cn(
                          themeOption.value,
                          currentMode,
                          "size-3 rounded-[3px] bg-secondary"
                        )}
                      />
                      <div
                        className={cn(
                          themeOption.value,
                          currentMode,
                          "size-3 rounded-[3px] bg-accent"
                        )}
                      />
                    </div>
                    <span>{themeOption.name}</span>
                  </div>
                  <div className="flex-1" />
                  {themeOption.value === currentTheme && (
                    <span className="text-xs text-muted-foreground">
                      Selected
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
