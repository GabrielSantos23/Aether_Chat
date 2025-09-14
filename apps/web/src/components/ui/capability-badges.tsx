import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brain, Eye, File, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CapabilityBadgesProps {
  capabilities?: string[];
  className?: string;
}

export function CapabilityBadges({
  capabilities,
  className,
}: CapabilityBadgesProps) {
  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  const sortedCapabilities = [...capabilities].sort((a, b) =>
    a.localeCompare(b)
  );

  const getCapabilityConfig = (capability: string) => {
    switch (capability) {
      case "reasoning":
        return {
          icon: Brain,
          bgColor: "bg-pink-400/10",
          iconColor: "text-pink-400",
        };
      // Coding-related
      case "coding":
      case "basic-coding":
        return {
          icon: Wrench,
          bgColor: "bg-green-400/10",
          iconColor: "text-green-400",
        };
      // Analysis / writing / chat map to existing icons
      case "analysis":
        return {
          icon: Eye,
          bgColor: "bg-blue-400/10",
          iconColor: "text-blue-400",
        };
      case "writing":
        return {
          icon: File,
          bgColor: "bg-yellow-400/10",
          iconColor: "text-yellow-400",
        };
      case "chat":
        return {
          icon: Brain,
          bgColor: "bg-gray-400/10",
          iconColor: "text-gray-400",
        };
      case "vision":
        return {
          icon: Eye,
          bgColor: "bg-blue-400/10",
          iconColor: "text-blue-400",
        };
      case "documents":
        return {
          icon: File,
          bgColor: "bg-yellow-400/10",
          iconColor: "text-yellow-400",
        };
      case "tools":
        return {
          icon: Wrench,
          bgColor: "bg-green-400/10",
          iconColor: "text-green-400",
        };
      default:
        return {
          icon: Brain,
          bgColor: "bg-gray-400/10",
          iconColor: "text-gray-400",
        };
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {sortedCapabilities.map((capability) => {
        const config = getCapabilityConfig(capability);
        const IconComponent = config.icon;

        return (
          <Tooltip key={capability}>
            <TooltipTrigger>
              <div
                className={cn(
                  "text-[10px] font-medium text-primary p-1 rounded-lg z-1",
                  config.bgColor
                )}
              >
                <IconComponent className={cn("size-3.5", config.iconColor)} />
              </div>
            </TooltipTrigger>
            <TooltipPositioner>
              <TooltipContent>
                {capability.charAt(0).toUpperCase() + capability.slice(1)}
              </TooltipContent>
            </TooltipPositioner>
          </Tooltip>
        );
      })}
    </div>
  );
}
