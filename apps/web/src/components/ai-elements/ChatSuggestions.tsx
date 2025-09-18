"use client";
import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Suggestions, Suggestion } from "./suggestion";
import { cn } from "@/lib/utils";

interface ChatSuggestionsProps {
  tool: string;
  isUnauthenticated: boolean;
  canModelUseTools: boolean;
  canSearch: boolean;
  canResearch: boolean;
  remainingSearches: number;
  remainingResearches: number;
  onPick: (text: string, tool?: string) => void;
}

const searchSuggestions = [
  "Summarize today's top AI news",
  "Find recent papers on retrieval-augmented generation",
  "Compare pricing of major LLM providers",
  "What are the latest Next.js 15 features?",
];

const chatSuggestions = [
  "Explain WebSockets like I'm five",
  "Refactor this function to be more readable",
  "Brainstorm 5 app ideas for travelers",
  "Write a SQL query to aggregate monthly revenue",
];

const researchSuggestions = [
  "Deeply research multimodal RAG best practices",
  "Map the LLM eval landscape and key benchmarks",
  "Create a brief on vector DBs with trade-offs",
  "Investigate prompt injection defenses and sources",
];

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

export const ChatSuggestions: FC<ChatSuggestionsProps> = ({
  tool,
  isUnauthenticated,
  canModelUseTools,
  canSearch,
  canResearch,
  remainingSearches,
  remainingResearches,
  onPick,
}) => {
  const variant =
    tool === "research" ? "research" : tool === "search" ? "search" : "chat";

  const disabledSearch =
    isUnauthenticated ||
    !canModelUseTools ||
    !canSearch ||
    remainingSearches <= 0;

  const disabledResearch =
    isUnauthenticated ||
    !canModelUseTools ||
    !canResearch ||
    remainingResearches <= 0;

  const items =
    variant === "search"
      ? searchSuggestions
      : variant === "research"
      ? researchSuggestions
      : chatSuggestions;

  return (
    <div
      className={cn("mx-auto w-full px-3 sm:px-6 max-w-3xl")}
      aria-hidden={false}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={variant}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Suggestions className="">
            {items.map((s, i) => (
              <motion.div
                key={`${variant}-${i}`}
                variants={itemVariants}
                layout
              >
                <Suggestion
                  suggestion={s}
                  onClick={() =>
                    onPick(s, variant === "chat" ? undefined : variant)
                  }
                  variant="secondary"
                  size="sm"
                  className="border bg-transparent hover:bg-muted"
                  disabled={
                    (variant === "search" && disabledSearch) ||
                    (variant === "research" && disabledResearch)
                  }
                />
              </motion.div>
            ))}
          </Suggestions>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatSuggestions;
