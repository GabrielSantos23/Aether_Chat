"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { BrainIcon } from "lucide-react";

interface ReasoningPartProps {
  id: string;
  index: number;
}

export const ReasoningPart = memo(function PureReasoningPart({
  id,
  index,
}: ReasoningPartProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BrainIcon className="size-3" />
        <span>Reasoning</span>
      </div>
    </div>
  );
});





