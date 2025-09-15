"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Brain, CheckIcon, SearchIcon, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";

interface ToolSidebarState {
  tool: "search" | "research";
  messageId: string;
  toolCallId: string;
  searchResults?: SearchResult[];
  researchResults?: ResearchResult[];
  query?: string;
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
}

interface ResearchResult {
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  reasoning?: string;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: {
    query: string;
    maxResults?: number;
    searchDepth?: string;
    timeRange?: string;
  };
  result: SearchResult[];
}

const mockToolSidebarState: ToolSidebarState | null = null;

export function RightSidebar() {
  const {
    isOpen,
    sidebarType,
    searchResults,
    searchQuery,
    researchResults,
    researchQuery,
    closeSidebar,
  } = useSidebar();

  const toolSidebar: ToolSidebarState | null = (() => {
    if (sidebarType === "search" && searchResults.length > 0) {
      return {
        tool: "search",
        messageId: "current",
        toolCallId: "current",
        searchResults,
        query: searchQuery,
      };
    }
    if (sidebarType === "research" && researchResults.length > 0) {
      return {
        tool: "research",
        messageId: "current",
        toolCallId: "current",
        researchResults,
        query: researchQuery,
      };
    }
    return null;
  })();

  useEffect(() => {
    (window as any).closeToolSidebar = closeSidebar;
  }, [closeSidebar]);

  if (!isOpen || !toolSidebar) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 flex flex-col">
      <ToolSidebarHeader tool={toolSidebar.tool} onClose={closeSidebar} />
      <ToolSidebarContent
        tool={toolSidebar.tool}
        messageId={toolSidebar.messageId}
        toolCallId={toolSidebar.toolCallId}
        searchResults={toolSidebar.searchResults}
        researchResults={toolSidebar.researchResults}
        query={toolSidebar.query}
      />
    </div>
  );
}

function ToolSidebarHeader({
  tool,
  onClose,
}: {
  tool: "search" | "research";
  onClose: () => void;
}) {
  const title = useMemo(() => {
    switch (tool) {
      case "search":
        return "Search Results";
      case "research":
        return "Research Results";
      default:
        return null;
    }
  }, [tool]);

  return (
    <div className="flex flex-row p-3 justify-between items-center border-b border-foreground/10 bg-background z-10">
      <h3 className="text-lg font-semibold flex gap-2 items-center">{title}</h3>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

function ToolSidebarContent({
  tool,
  messageId,
  toolCallId,
  searchResults,
  researchResults,
  query,
}: {
  tool: "search" | "research";
  messageId: string;
  toolCallId: string;
  searchResults?: SearchResult[];
  researchResults?: ResearchResult[];
  query?: string;
}) {
  switch (tool) {
    case "search":
      return (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SearchToolSidebarContent
            searchResults={searchResults}
            query={query}
          />
        </div>
      );
    case "research":
      return (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ResearchToolSidebarContent
            researchResults={researchResults}
            query={query}
          />
        </div>
      );
    default:
      return null;
  }
}

function SearchToolSidebarContent({
  searchResults,
  query,
}: {
  searchResults?: SearchResult[];
  query?: string;
}) {
  const results = searchResults || [];

  if (query) {
  }

  if (!results || results.length === 0) {
    return (
      <div className="space-y-3">
        {query && (
          <div className="text-sm font-medium text-muted-foreground p-2">
            Searching for: "{query}"
          </div>
        )}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 * (i + 1) }}
            className="flex flex-col gap-2 p-3 rounded-lg"
          >
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {query && (
        <div className="text-sm font-medium text-muted-foreground p-2 border-b">
          Search results for: "{query}"
        </div>
      )}
      {results.map((result, i) => {
        let hostname = "example.com";
        try {
          const url = new URL(result.url);
          hostname = url.hostname || "example.com";
        } catch {
          hostname = "example.com";
        }

        return (
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 * (i + 1) }}
            key={result.url}
            className="flex flex-col gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-medium line-clamp-2 flex-1">
                {result.title}
              </div>
              <ExternalLink className="size-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>

            <div className="text-xs text-muted-foreground line-clamp-3">
              {result.content}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <img
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
                alt={result.title ?? "favicon"}
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'%3E%3C/svg%3E";
                }}
              />
              <span className="truncate">{result.url}</span>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}

function ResearchToolSidebarContent({
  researchResults,
  query,
}: {
  researchResults?: ResearchResult[];
  query?: string;
}) {
  const results = researchResults || [];

  if (!results || results.length === 0) {
    return (
      <div className="space-y-3">
        {query && (
          <div className="text-sm font-medium text-muted-foreground p-2">
            Researching: "{query}"
          </div>
        )}
        {Array.from({ length: 2 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 * (i + 1) }}
            className="flex flex-col gap-2 p-3 rounded-lg"
          >
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {query && (
        <div className="text-sm font-medium text-muted-foreground p-2 border-b">
          Research results for: "{query}"
        </div>
      )}
      {results.map((result, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="p-4 rounded-lg border border-border/50 bg-card/50"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Research Finding</span>
              {result.confidence && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round(result.confidence * 100)}% confidence)
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold">{result.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.content}
            </p>
            {result.reasoning && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Reasoning:
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.reasoning}
                </p>
              </div>
            )}
            {result.source && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Source: {result.source}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
