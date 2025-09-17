"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { FileTextIcon } from "lucide-react";

interface TextPartProps {
  id: string;
  index: number;
}

export const TextPart = memo(function PureTextPart({
  id,
  index,
}: TextPartProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileTextIcon className="size-3" />
        <span>Text</span>
      </div>
    </div>
  );
});







