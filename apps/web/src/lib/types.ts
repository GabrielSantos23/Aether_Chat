/**
 * Shared types for the Aether AI application
 * These types are derived from the Convex schema and used across the UI
 */

// Base types from Convex schema
export type MessageRole = "user" | "assistant";

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface Message {
  _id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  thinking?: string;
  thinkingDuration?: number;
  isComplete?: boolean;
  isCancelled?: boolean;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  createdAt: number;
}

// Message state interface for UI components
export interface MessageState {
  isComplete?: boolean;
  content?: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

// Upload-related types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  key: string;
}

// Tool call result types
export interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
  score?: number;
}

export interface WebSearchResult {
  results: SearchResult[];
  query: string;
  timestamp: number;
}

// Session and user types
export interface SessionItem {
  sessionToken: string;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  createdAt?: number;
  expires: number;
}

// Model types
export interface ModelInfo {
  id: string;
  name: string;
  icon?: string;
  provider?: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
}

// Research and tool types
export interface ResearchAction {
  type: "search" | "read";
  toolCallId: string;
  thoughts: string;
  query?: string;
  url?: string;
  timestamp: number;
}

export interface ResearchSession {
  _id: string;
  userId: string;
  prompt: string;
  thoughts: string;
  status: "running" | "completed" | "failed";
  summary?: string;
  actions: ResearchAction[];
  createdAt: number;
  completedAt?: number;
}

// Chat types
export interface Chat {
  _id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  shareId?: string;
  isShared?: boolean;
  isGeneratingTitle?: boolean;
  isBranch?: boolean;
  isPinned?: boolean;
}

// User settings types
export type MainFont = "inter" | "system" | "serif" | "mono" | "roboto-slab";
export type CodeFont =
  | "fira-code"
  | "mono"
  | "consolas"
  | "jetbrains"
  | "source-code-pro";
export type SendBehavior = "enter" | "shiftEnter" | "button";

export interface UserSettings {
  userId: string;
  uploadthing_key?: string;
  tavily_key?: string;
  userName?: string;
  userRole?: string;
  userTraits?: string[];
  userAdditionalInfo?: string;
  promptTemplate?: string;
  mainFont?: MainFont;
  codeFont?: CodeFont;
  sendBehavior?: SendBehavior;
  autoSave?: boolean;
  showTimestamps?: boolean;
  disabledModels?: string[];
  mem0Enabled?: boolean;
  observations?: string[];
}

// API key types
export type ApiKeyService =
  | "gemini"
  | "groq"
  | "openrouter"
  | "moonshot"
  | "deepgram";

export interface ApiKey {
  _id: string;
  userId: string;
  service: ApiKeyService;
  name: string;
  key: string;
  is_default?: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
