"use client";

import { memo, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { AIMessage } from "./ai-message";
import { UserMessage } from "./user-message";
import { Message as MessageType } from "@/lib/types";

interface VirtualizedMessageListProps {
  messages: MessageType[];
  onUserMessageEdit: (messageId: string, content: string) => void;
  onAIMessageRegenerate: (messageIndex: number) => void;
  className?: string;
}

export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  onUserMessageEdit,
  onAIMessageRegenerate,
  className,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the virtualizer configuration
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 200, []), // Estimate 200px per message
    overscan: 5, // Render 5 extra items outside the visible area
  });

  // Memoize the message items to prevent unnecessary re-renders
  const messageItems = useMemo(() => {
    return virtualizer.getVirtualItems().map((virtualItem) => {
      const message = messages[virtualItem.index];
      const isUserMessage = message.role === "user";

      // Check if there's a previous user message for regeneration logic
      let hasPreviousUserMessage = false;
      if (!isUserMessage) {
        for (let i = virtualItem.index - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            hasPreviousUserMessage = true;
            break;
          }
        }
      }

      return (
        <div
          key={message._id}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {isUserMessage ? (
            <UserMessage message={message} onEdit={onUserMessageEdit} />
          ) : (
            <AIMessage
              message={message}
              onRegenerate={() => onAIMessageRegenerate(virtualItem.index)}
              canRegenerate={hasPreviousUserMessage}
            />
          )}
        </div>
      );
    });
  }, [
    virtualizer.getVirtualItems(),
    messages,
    onUserMessageEdit,
    onAIMessageRegenerate,
  ]);

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-auto ${className || ""}`}
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {messageItems}
      </div>
    </div>
  );
});
