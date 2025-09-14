"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { models } from "@/lib/models";
import { useModel } from "@/contexts/ModelContext";
import { useAction } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { toast } from "sonner";

export default function SearchDebugPage() {
  const { selectedModelId } = useModel();
  const [tool, setTool] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState(
    "What are AI startups that are based in NYC?"
  );

  const sendMessage = useAction(api.chat.actions.sendMessage);

  const selectedModel = models.find((model) => model.id === selectedModelId);

  const canSearch = !!(
    selectedModel?.toolCalls && selectedModel?.features?.includes("web")
  );
  const canModelUseTools = selectedModel?.toolCalls ?? false;

  const handleTestSearch = async () => {
    if (!canSearch) {
      toast.error("Selected model doesn't support web search");
      return;
    }

    setIsLoading(true);
    try {
      // Create a test chat
      const result = await sendMessage({
        chatId: "test-chat-id" as any, // This will fail but we can see the logs
        message: testMessage,
        modelId: selectedModelId,
        webSearch: tool === "search",
        research: tool === "research",
      });

      console.log("Test search result:", result);
      toast.success("Test message sent! Check console for logs.");
    } catch (error) {
      console.error("Test search error:", error);
      toast.error("Test failed - check console for details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Search Tool Debug & Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Current Model: {selectedModel?.name || "None"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant={canModelUseTools ? "default" : "secondary"}>
                  Tool Calls: {canModelUseTools ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div>
                <Badge
                  variant={
                    selectedModel?.features?.includes("web")
                      ? "default"
                      : "secondary"
                  }
                >
                  Web Search:{" "}
                  {selectedModel?.features?.includes("web")
                    ? "Supported"
                    : "Not Supported"}
                </Badge>
              </div>
            </div>
            <div>
              <Badge variant={canSearch ? "default" : "destructive"}>
                Can Search: {canSearch ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Tool State</h3>
            <div className="flex gap-2">
              <Button
                variant={tool === "" ? "default" : "outline"}
                onClick={() => setTool("")}
              >
                Chat Only
              </Button>
              <Button
                variant={tool === "search" ? "default" : "outline"}
                onClick={() => setTool("search")}
                disabled={!canSearch}
              >
                Web Search
              </Button>
              <Button
                variant={tool === "research" ? "default" : "outline"}
                onClick={() => setTool("research")}
                disabled={!selectedModel?.canResearch}
              >
                Deep Research
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current tool: {tool || "None (Chat Only)"}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Search</h3>
            <div className="space-y-2">
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter test message..."
              />
              <Button
                onClick={handleTestSearch}
                disabled={!canSearch || isLoading}
                className="w-full"
              >
                {isLoading ? "Testing..." : "Test Search"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will send a test message and show logs in the console. Check
              the browser console and backend logs for debugging information.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Models with Web Search Support
            </h3>
            <div className="space-y-2">
              {models
                .filter(
                  (model) => model.toolCalls && model.features?.includes("web")
                )
                .map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({model.id})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={model.isFree ? "secondary" : "default"}>
                        {model.isFree ? "Free" : "Pro"}
                      </Badge>
                      <Badge
                        variant={model.isApiKeyOnly ? "destructive" : "default"}
                      >
                        {model.isApiKeyOnly ? "API Key Required" : "No API Key"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Debugging Steps</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Select a model that supports web search (see list above)</p>
              <p>2. Enable the "Web Search" tool</p>
              <p>3. Click "Test Search" to send a test message</p>
              <p>4. Check browser console for frontend logs</p>
              <p>5. Check backend logs for:</p>
              <ul className="ml-4 list-disc">
                <li>🔍 Web search enabled - adding search tool</li>
                <li>🔍 Search tool added. Active tools: search</li>
                <li>🎯 getPrompt called with activeTools: ["search"]</li>
                <li>🎯 Using search tool prompt</li>
                <li>🔍 Search tool called with query: "..."</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
