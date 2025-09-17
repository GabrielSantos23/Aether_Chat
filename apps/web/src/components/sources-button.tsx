"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, ExternalLink, Loader2Icon } from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";

interface SourcesButtonProps {
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    result: any;
  }>;
}

export function SourcesButton({ toolCalls }: SourcesButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { openSearchSidebar } = useSidebar();

  const searchToolCalls =
    toolCalls?.filter((tc) => tc.toolName === "webSearch") || [];

  if (searchToolCalls.length === 0) {
    return null;
  }

  const searchCall = searchToolCalls[0];
  const hasResult = searchCall?.result !== undefined;
  const hasNonEmptyArrayResult = Array.isArray(searchCall?.result)
    ? searchCall.result.length > 0
    : false;
  const isDone =
    hasResult && (hasNonEmptyArrayResult || !Array.isArray(searchCall?.result));
  const searchResults =
    isDone && Array.isArray(searchCall?.result) ? searchCall.result : [];
  const query = searchCall?.args?.query || "Search";

  const handleClick = () => {
    openSearchSidebar(searchResults, query);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3"
    >
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md cursor-pointer  hover:bg-muted transition-colors"
      >
        <SearchIcon className="w-3 h-3" />
        <span>{isDone ? "Searched" : "Searching"}</span>
        {!isDone && <Loader2Icon className="size-3 animate-spin" />}
      </button>
    </motion.div>
  );
}
