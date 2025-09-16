"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Markdown } from "@/components/ui/markdown";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { RefreshCw, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipPositioner,
} from "@/components/ui/tooltip";
import { models as availableModels } from "@/components/models";
import ModelIcon, { type ModelType } from "@/components/icons/model-icon";
import { toast } from "sonner";
import { PendingMessage } from "./pending-message";
import { SearchTool } from "./search-tool";
import { Part } from "./part";
import { SourcesButton } from "../sources-button";
import { ResearchButton } from "../research-button";
import { UrlResultButton } from "../url-result-button";

interface AIMessageProps {
  message: any;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export const AIMessage = memo(function AIMessage({
  message,
  onRegenerate,
  canRegenerate = false,
}: AIMessageProps) {
  const modelObj = message.modelId
    ? availableModels.find((m) => m.id === message.modelId)
    : undefined;
  const modelName = modelObj?.name || (message.modelId as string | undefined);
  const modelIcon = (modelObj?.icon as ModelType | undefined) ?? undefined;

  const handleCopy = async () => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        toast.success("Copied to clipboard");
      } catch (err) {
        console.error("Copy failed", err);
        toast.error("Copy failed");
      }
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const isLoading =
    !message.isComplete &&
    !message.content &&
    !message.thinking &&
    !message.toolCalls?.length;
  const hasThinking =
    message.thinking &&
    typeof message.thinking === "string" &&
    message.thinking.trim().length > 0;

  const isReasoningStreaming = hasThinking && !message.isComplete;
  const reasoningDuration = message.thinkingDuration || 0;

  // Extract URLs from search tool calls
  const searchToolCalls =
    message.toolCalls?.filter((tc: any) => tc.toolName === "webSearch") || [];
  const searchResults =
    searchToolCalls.length > 0 ? searchToolCalls[0]?.result || [] : [];
  const urls = searchResults.map((result: any) => result.url).filter(Boolean);

  if (isLoading) {
    return (
      <Message from="assistant" key={message._id} data-message-id={message._id}>
        <MessageContent
          className={cn(
            "group-[.is-assistant]:bg-transparent group-[.is-assistant]:border-transparent",
            "rounded-2xl group-[.is-assistant]:rounded-bl-sm",
            "text-sm sm:text-[15px] leading-5 sm:leading-6"
          )}
        >
          <PendingMessage />
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant" key={message._id} data-message-id={message._id}>
      <MessageContent
        className={cn(
          "group-[.is-assistant]:bg-transparent group-[.is-assistant]:border-transparent",
          "rounded-2xl group-[.is-assistant]:rounded-bl-sm",
          "text-sm sm:text-[15px] leading-5 sm:leading-6"
        )}
      >
        <div className="space-y-2 sm:space-y-3">
          {/* Sources button at the top */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="space-y-2">
              <SourcesButton toolCalls={message.toolCalls} />
              <ResearchButton toolCalls={message.toolCalls} />
            </div>
          )}

          {hasThinking && (
            <div className="reasoning-container">
              <Reasoning
                isStreaming={isReasoningStreaming}
                duration={reasoningDuration}
              >
                <ReasoningTrigger />
                <ReasoningContent className="whitespace-pre-wrap text-muted-foreground">
                  {message.thinking}
                </ReasoningContent>
              </Reasoning>
            </div>
          )}

          {message.content && <Markdown animated>{message.content}</Markdown>}

          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment: any, index: number) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-auto max-w-full overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(attachment.url, "_blank")}
                />
              ))}
            </div>
          )}

          {/* URL results at the bottom */}
          {urls.length > 0 && (
            <div className="mt-4">
              <UrlResultButton
                urls={urls}
                count={urls.length}
                label={urls.length === 1 ? "source" : "sources"}
                onClick={() => {
                  // You can add click handler here if needed
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs text-muted-foreground/80">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
                  disabled={!message.content}
                >
                  <Copy className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipPositioner>
                <TooltipContent>Copy</TooltipContent>
              </TooltipPositioner>
            </Tooltip>

            {canRegenerate && (
              <Tooltip>
                <TooltipTrigger>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipPositioner>
                  <TooltipContent>Regenerate</TooltipContent>
                </TooltipPositioner>
              </Tooltip>
            )}
            {modelName && (
              <div className="flex items-center gap-1 sm:gap-2 ml-2 px-1 sm:px-2 py-1">
                {modelIcon && (
                  <ModelIcon
                    model={modelIcon}
                    className="size-3 sm:size-3.5 shrink-0 fill-primary"
                  />
                )}
                <span className="text-xs truncate max-w-[120px] sm:max-w-none">
                  {modelName}
                </span>
              </div>
            )}
          </div>
        </div>
      </MessageContent>
    </Message>
  );
});
