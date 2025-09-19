import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AlignJustify, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@aether-ai-2/backend/convex/_generated/api";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { Id } from "@aether-ai-2/backend/convex/_generated/dataModel";
import type { Message as MessageType, ToolCall } from "@/lib/types";

// Use the shared Message type from lib/types
type Message = MessageType;

function getTruncatedText(text: string, maxLength: number = 32) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength - 3) + "...";
  }
  return text;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

interface MessageHistoryProps {
  chatId?: Id<"chats">;
}

export default function MessageHistory({ chatId }: MessageHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status } = useSession();
  const { isLoading: isConvexLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth();
  const hasConvexToken = !!(session && (session as any).convexToken);
  const isAuthenticated =
    status === "authenticated" &&
    !!session?.user &&
    hasConvexToken &&
    isConvexAuthenticated;

  const isSessionLoading = status === "loading" || isConvexLoading;
  const shouldSkipQueries = isSessionLoading || !isAuthenticated || !chatId;

  const messages = useQuery(
    api.chat.queries.getChatMessages,
    shouldSkipQueries ? "skip" : { chatId }
  );

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchQuery.trim()) return messages;

    return messages.filter((message) =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleMessageClick = (messageId: string) => {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      messageElement.classList.add(
        "ring/10",
        "ring-primary/50",
        "ring-opacity-50",
        "rounded-2xl"
      );
      setTimeout(() => {
        messageElement.classList.remove(
          "ring",
          "ring-primary/50",
          "ring-opacity-50"
        );
      }, 2000);
    }
  };

  if (isSessionLoading) {
    return (
      <Popover>
        <PopoverTrigger asChild className="bg-background border">
          <Button variant="ghost" disabled>
            <AlignJustify />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="p-3 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (!chatId) {
    return (
      <Popover>
        <PopoverTrigger asChild className="bg-background border">
          <Button variant="ghost" disabled>
            <AlignJustify />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="p-3 text-center text-muted-foreground text-sm">
            No chat selected
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild className="bg-background border">
        <Button variant="ghost">
          <AlignJustify />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div>
          <div className="flex items-center border px-2 rounded">
            <Search size={15} />
            <Input
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!bg-transparent !border-none focus:!ring-0 focus:!border-none outline-none shadow-none"
              style={{ background: "transparent", boxShadow: "none" }}
              tabIndex={0}
            />
          </div>
          <div className="mt-3">
            <ScrollArea className="h-64">
              <div className="">
                {filteredMessages.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    {searchQuery ? "No messages found" : "No messages yet"}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message._id}
                      className="p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                      onClick={() => handleMessageClick(message._id)}
                    >
                      <h4
                        className="font-medium text-sm mb-1 truncate"
                        title={message.content}
                        style={{
                          maxWidth: "100%",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getTruncatedText(message.content)}
                      </h4>
                      <p className="text-xs text-muted-foreground/70">
                        {formatRelativeTime(message.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
