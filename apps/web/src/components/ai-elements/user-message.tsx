"use client";

import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Copy, Edit } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipPositioner,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { type Message as MessageType } from "@/lib/types";

interface UserMessageProps {
  message: MessageType;
  onEdit?: (messageId: string, content: string) => void;
}

export const UserMessage = memo(function UserMessage({
  message,
  onEdit,
}: UserMessageProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Copy failed");
    }
  }, [message.content]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(message._id, message.content);
    }
  }, [onEdit, message._id, message.content]);

  return (
    <Message
      from="user"
      key={message._id}
      className="group"
      data-message-id={message._id}
    >
      <MessageContent
        className={cn(
          "group-[.is-user]:bg-muted border dark:group-[.is-user]:text-foreground group-[.is-user]:text-foreground border-muted-foreground/20",
          "rounded-2xl group-[.is-user]:rounded-br-sm",
          "text-sm sm:text-[15px] leading-5 sm:leading-6"
        )}
      >
        <Response>{message.content}</Response>

        {/* Render attachments - responsive images */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mt-2 sm:mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {message.attachments.map((attachment, index: number) => (
                <div key={index} className="relative group/image">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-auto w-full max-h-[300px] sm:max-h-[200px] object-cover overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(attachment.url, "_blank")}
                  />
                  {/* Image overlay for mobile */}
                  <div className="sm:hidden absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                      Tap to view
                    </span>
                  </div>
                  {/* Image name tooltip for desktop */}
                  {attachment.name && (
                    <div className="hidden sm:block absolute bottom-2 left-2 right-2">
                      <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate opacity-0 group-hover/image:opacity-100 transition-opacity">
                        {attachment.name}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Mobile attachment info */}
            <div className="sm:hidden">
              {message.attachments.map(
                (attachment, index: number) =>
                  attachment.name && (
                    <div
                      key={`name-${index}`}
                      className="text-xs text-muted-foreground truncate"
                    >
                      {attachment.name}
                    </div>
                  )
              )}
            </div>
          </div>
        )}
      </MessageContent>

      {/* Mobile buttons - below the message */}
      <div className="block sm:hidden mt-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-background/60 text-xs min-h-[36px] touch-manipulation"
          >
            <Copy className="size-3.5" />
            <span>Copy</span>
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-background/60 text-xs min-h-[36px] touch-manipulation"
            >
              <Edit className="size-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop buttons - positioned relative to the entire message */}
      <div className="hidden sm:block relative">
        <div className="absolute -right-0 -top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1 rounded-md shadow-sm p-1">
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted/60"
                >
                  <Copy className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipPositioner>
                <TooltipContent>Copy message</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted/60"
                  >
                    <Edit className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipPositioner>
                  <TooltipContent>Edit message</TooltipContent>
                </TooltipPositioner>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </Message>
  );
});
