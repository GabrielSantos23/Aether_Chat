"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, ExternalLink } from "lucide-react";
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
  const searchResults = searchCall?.result || [];
  const query = searchCall?.args?.query || "Search results";

  if (!searchResults || searchResults.length === 0) {
    return null;
  }

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
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-2 text-xs hover:bg-muted transition-colors"
      >
        <SearchIcon className="w-3 h-3" />
        <span>
          View {searchResults.length} source
          {searchResults.length !== 1 ? "s" : ""}
        </span>
        <ExternalLink
          className={`w-3 h-3 transition-transform ${
            isHovered ? "translate-x-0.5 -translate-y-0.5" : ""
          }`}
        />
      </Button>
    </motion.div>
  );
}
