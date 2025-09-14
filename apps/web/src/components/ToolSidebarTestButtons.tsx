"use client";

import { Button } from "@/components/ui/button";
import { Search, Brain } from "lucide-react";

export function ToolSidebarTestButtons() {
  const openSearchSidebar = () => {
    if ((window as any).openToolSidebar) {
      (window as any).openToolSidebar(
        "search",
        "test-message-id",
        "test-tool-call-id"
      );
    }
  };

  const openResearchSidebar = () => {
    if ((window as any).openToolSidebar) {
      (window as any).openToolSidebar(
        "research",
        "test-message-id",
        "test-tool-call-id"
      );
    }
  };

  return (
    <div className="flex gap-2 p-4">
      <Button onClick={openSearchSidebar} variant="outline" size="sm">
        <Search className="size-4 mr-2" />
        Test Search Sidebar
      </Button>
      <Button onClick={openResearchSidebar} variant="outline" size="sm">
        <Brain className="size-4 mr-2" />
        Test Research Sidebar
      </Button>
    </div>
  );
}
