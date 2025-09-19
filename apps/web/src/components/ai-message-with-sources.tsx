import { SourcesButton } from "./sources-button";
import type { ToolCall } from "@/lib/types";

interface AIMessageWithSourcesProps {
  content: string;
  toolCalls?: ToolCall[];
  isComplete?: boolean;
}

export function AIMessageWithSources({
  content,
  toolCalls,
  isComplete = true,
}: AIMessageWithSourcesProps) {
  return (
    <div className="space-y-3">
      <div className="prose prose-sm max-w-none">{content}</div>

      {isComplete && toolCalls && toolCalls.length > 0 && (
        <SourcesButton toolCalls={toolCalls} />
      )}
    </div>
  );
}
