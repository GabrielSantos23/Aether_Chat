"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { ToolCall } from "@/lib/types";

interface ResearchButtonProps {
  toolCalls?: ToolCall[];
}

export function ResearchButton({ toolCalls }: ResearchButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { openResearchSidebar } = useSidebar();

  const researchToolCalls =
    toolCalls?.filter((tc) => tc.toolName === "research") || [];

  if (researchToolCalls.length === 0) {
    return null;
  }

  const researchCall = researchToolCalls[0];
  const researchResults = researchCall?.result || [];
  const query = researchCall?.args?.query || "Research results";

  if (!researchResults || researchResults.length === 0) {
    return null;
  }

  const handleClick = () => {
    openResearchSidebar(researchResults, query);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-2 text-xs bg-background/50 hover:bg-background/80 border-border/50 hover:border-border transition-all duration-200"
      >
        <Brain className="w-3 h-3" />
        <span>
          View {researchResults.length} research result
          {researchResults.length !== 1 ? "s" : ""}
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
