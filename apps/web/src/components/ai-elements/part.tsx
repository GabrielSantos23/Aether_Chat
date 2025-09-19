"use client";

import { memo } from "react";
import { SearchPart } from "./search-part";
import { ReasoningPart } from "./reasoning-part";
import { TextPart } from "./text-part";
import { ErrorPart } from "./error-part";
import type { ToolCall } from "@/lib/types";

interface PartProps {
  id: string;
  index: number;
  type: string;
  toolCallId?: string;
  done?: boolean;
  toolCall?: ToolCall;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Part = memo(function Part({
  id,
  index,
  type,
  toolCallId,
  done = false,
  toolCall,
  onToggleSidebar,
  isSidebarOpen = false,
}: PartProps) {
  switch (type) {
    case "reasoning":
      return <ReasoningPart id={id} index={index} />;
    case "text":
      return <TextPart id={id} index={index} />;
    case "tool-search":
      return (
        <SearchPart
          id={id}
          index={index}
          toolCallId={toolCallId || ""}
          done={done}
          toolCall={toolCall}
          onToggleSidebar={onToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      );
    case "data-error":
      return <ErrorPart id={id} index={index} />;
    default:
      return null;
  }
});
