"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
}

interface ResearchResult {
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  reasoning?: string;
}

interface SidebarContextType {
  isOpen: boolean;
  sidebarType: "search" | "research" | null;
  searchResults: SearchResult[];
  searchQuery: string;
  researchResults: ResearchResult[];
  researchQuery: string;
  openSearchSidebar: (results: SearchResult[], query: string) => void;
  openResearchSidebar: (results: ResearchResult[], query: string) => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState<"search" | "research" | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [researchQuery, setResearchQuery] = useState("");

  const openSearchSidebar = (results: SearchResult[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setResearchResults([]);
    setResearchQuery("");
    setSidebarType("search");
    setIsOpen(true);
  };

  const openResearchSidebar = (results: ResearchResult[], query: string) => {
    setResearchResults(results);
    setResearchQuery(query);
    setSearchResults([]);
    setSearchQuery("");
    setSidebarType("research");
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
    setSidebarType(null);
    setSearchResults([]);
    setSearchQuery("");
    setResearchResults([]);
    setResearchQuery("");
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        sidebarType,
        searchResults,
        searchQuery,
        researchResults,
        researchQuery,
        openSearchSidebar,
        openResearchSidebar,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
