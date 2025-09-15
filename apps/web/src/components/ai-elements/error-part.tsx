"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircleIcon } from "lucide-react";

interface ErrorPartProps {
  id: string;
  index: number;
}

export const ErrorPart = memo(function PureErrorPart({
  id,
  index,
}: ErrorPartProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircleIcon className="size-3" />
        <span>Error</span>
      </div>
    </div>
  );
});






