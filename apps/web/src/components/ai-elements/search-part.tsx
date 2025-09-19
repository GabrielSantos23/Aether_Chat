"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { SearchTool } from "./search-tool";
import type { ToolCall } from "@/lib/types";

interface SearchPartProps {
  id: string;
  index: number;
  toolCallId: string;
  done: boolean;
  toolCall?: ToolCall;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const SearchPart = memo(function PureSearchPart({
  id,
  index,
  toolCallId,
  done,
  toolCall,
  onToggleSidebar,
  isSidebarOpen = false,
}: SearchPartProps) {
  if (done && toolCall?.result) {
    return <SearchTool toolCall={toolCall} />;
  }

  return (
    <div className={cn("w-full", !done && "animate-pulse")}>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <SearchIcon className="size-3" />
        <span>{done ? "Searched" : "Searching"}</span>
        {!done && <Loader2Icon className="size-3 animate-spin" />}
      </button>
    </div>
  );
});
