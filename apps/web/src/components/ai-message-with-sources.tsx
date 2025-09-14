"use client";

import { SourcesButton } from "./sources-button";

interface AIMessageWithSourcesProps {
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    result: any;
  }>;
  isComplete?: boolean;
}

export function AIMessageWithSources({
  content,
  toolCalls,
  isComplete = true,
}: AIMessageWithSourcesProps) {
  return (
    <div className="space-y-3">
      {/* AI Response Content */}
      <div className="prose prose-sm max-w-none">{content}</div>

      {/* Sources Button - only show when complete and has search results */}
      {isComplete && toolCalls && toolCalls.length > 0 && (
        <SourcesButton toolCalls={toolCalls} />
      )}
    </div>
  );
}
