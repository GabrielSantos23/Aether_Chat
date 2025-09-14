"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Search,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
}

interface SearchToolCall {
  toolCallId: string;
  toolName: string;
  args: {
    query: string;
  };
  result: {
    query: string;
    results: SearchResult[];
    timestamp: string;
    error?: string;
  };
}

interface SearchToolProps {
  toolCall: SearchToolCall;
  className?: string;
}

export function SearchTool({ toolCall, className }: SearchToolProps) {
  const { args, result } = toolCall;
  const [isExpanded, setIsExpanded] = useState(false);

  if (result.error) {
    return (
      <Card className={cn("border-destructive/20 bg-destructive/5", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-destructive" />
            <CardTitle className="text-sm text-destructive">
              Search Error
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <Card
      className={cn(
        "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            Web Search
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {result.results?.length || 0} results
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Searched for: <span className="font-medium">"{args.query}"</span>
        </p>
      </CardHeader>

      {result.results && result.results.length > 0 ? (
        <CardContent className="space-y-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            <span>{isExpanded ? "Hide" : "Show"} search results</span>
          </button>

          {isExpanded && (
            <div className="space-y-3">
              {result.results.map((item, index) => (
                <div
                  key={index}
                  className="group rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4
                      className="font-medium text-sm leading-tight overflow-hidden text-ellipsis group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.title}
                    </h4>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="size-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>

                  <p
                    className="text-xs text-muted-foreground overflow-hidden text-ellipsis mb-2"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">{item.url}</span>
                    </div>
                    {item.published_date && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Clock className="size-3" />
                        <span>{formatDate(item.published_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Search completed at{" "}
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No results found for "{args.query}"
          </p>
        </CardContent>
      )}
    </Card>
  );
}
