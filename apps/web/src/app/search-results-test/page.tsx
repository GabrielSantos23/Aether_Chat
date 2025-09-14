"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { models } from "@/lib/models";
import { useModel } from "@/contexts/ModelContext";

export default function SearchResultsTestPage() {
  const { selectedModelId } = useModel();
  const [tool, setTool] = useState<string>("search");

  const selectedModel = models.find((model) => model.id === selectedModelId);

  const canSearch = !!(
    selectedModel?.toolCalls && selectedModel?.features?.includes("web")
  );

  // Mock search results to test the UI
  const mockSearchResults = {
    query: "AI startups NYC New York City",
    results: [
      {
        title: "NY Ecosystem — Tech:NYC",
        url: "https://www.technyc.org/nyc-tech-snapshot-2025",
        content:
          "New York City's tech ecosystem continues to grow with over 9,000 startups and 200+ AI companies calling the city home.",
        published_date: "2024-12-01",
      },
      {
        title: "Top AI Startups in New York City 2024",
        url: "https://example.com/ai-startups-nyc-2024",
        content:
          "Notable AI startups include Anthropic, Scale AI, and many others that have established their presence in NYC.",
        published_date: "2024-11-15",
      },
      {
        title: "NYC AI Startup Ecosystem Report",
        url: "https://example.com/nyc-ai-ecosystem-report",
        content:
          "The New York AI startup scene has grown significantly with over 200 AI companies calling NYC home.",
        published_date: "2024-10-20",
      },
    ],
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Search Results UI Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Current Model: {selectedModel?.name || "None"}
            </h3>
            <div className="flex gap-2">
              <Badge variant={canSearch ? "default" : "destructive"}>
                Can Search: {canSearch ? "Yes" : "No"}
              </Badge>
              <Badge variant={tool === "search" ? "default" : "secondary"}>
                Tool: {tool}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Mock Search Results Display
            </h3>
            <p className="text-sm text-muted-foreground">
              This shows how the search results should appear in the chat
              interface:
            </p>

            {/* This simulates what should appear in the chat */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  Searching for up-to-date information.
                </span>
                <Badge variant="secondary" className="text-xs">
                  Searched
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                {mockSearchResults.results.map((result, index) => (
                  <div key={index} className="border rounded p-3 bg-background">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm leading-tight">
                        {result.title}
                      </h4>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        🔗
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {result.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{result.url}</span>
                      <span>
                        {new Date(result.published_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Expected Behavior</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. AI should say "Searching for up-to-date information..."</p>
              <p>2. Show "Searching..." with spinner</p>
              <p>3. After search completes, show "Searched"</p>
              <p>4. Display search results in expandable format</p>
              <p>5. AI should analyze and summarize the results</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Debugging Steps</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Enable web search tool</p>
              <p>2. Ask: "What are AI startups that are based in NYC?"</p>
              <p>3. Check console for these logs:</p>
              <ul className="ml-4 list-disc">
                <li>🔍 Search tool called with query: "..."</li>
                <li>🔍 Search completed successfully with X results</li>
                <li>🔍 Tool result received for toolCallId: ...</li>
                <li>📝 Text delta: "Based on my search..."</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





