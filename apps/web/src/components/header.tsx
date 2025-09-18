"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { ThemeSelector } from "./theme-selector";
import ModelSelector from "./model-selector";
import MessageHistory from "./ai-elements/message-history";
import { UserButton } from "./user-button";
import { cn } from "@/lib/utils";
import type { Id } from "@aether-ai-2/backend/convex/_generated/dataModel";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  chatId?: string;
  threadId?: string;
  toolSidebar?: boolean;
}

export default function Header({ chatId, threadId, toolSidebar }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { sidebarVariant } = useTheme();
  const { open: isSidebarOpen } = useSidebar();

  return (
    <header
      className={cn(
        "bg-background/50 absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-2",
        !toolSidebar && "2xl:",
        sidebarVariant === "sidebar" &&
          "border-b  bg-background/40 backdrop-blur-md"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {!isSidebarOpen && <SidebarTrigger className="p-3 sm:p-5" />}
        <div className="hidden sm:block">
          <ModelSelector />
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <MessageHistory chatId={chatId as Id<"chats"> | undefined} />
        <ThemeSelector />
        <UserButton />
        <button
          className="sm:hidden ml-2 p-2 rounded-md border border-transparent hover:border-foreground/20 transition"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-background/95 border-b border-foreground/10 shadow-md z-20 flex flex-col gap-2 px-4 py-3 animate-in fade-in slide-in-from-top-2">
          <ModelSelector />
          <MessageHistory chatId={chatId as Id<"chats"> | undefined} />
        </div>
      )}
    </header>
  );
}
