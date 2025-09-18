/**
 * Centralized message state predicates for consistent state checking across components
 */

import { type MessageState, type ToolCall, type SearchResult } from "./types";

/**
 * Check if a message is currently loading (no content, thinking, or tool calls)
 */
export const isLoading = (message: MessageState): boolean => {
  return (
    !message.isComplete &&
    (!message.content || message.content.trim() === "") &&
    (!message.thinking || message.thinking.trim() === "") &&
    !message.toolCalls?.length
  );
};

/**
 * Check if a message is currently streaming (has content but not complete)
 */
export const isStreaming = (message: MessageState): boolean => {
  return !message.isComplete && !!message.content;
};

/**
 * Check if a message has thinking content
 */
export const hasThinking = (message: MessageState): boolean => {
  return (
    !!message.thinking &&
    typeof message.thinking === "string" &&
    message.thinking.trim().length > 0
  );
};

/**
 * Check if a message has tool calls
 */
export const hasTools = (message: MessageState): boolean => {
  return !!(message.toolCalls && message.toolCalls.length > 0);
};

/**
 * Check if reasoning is currently streaming
 */
export const isReasoningStreaming = (message: MessageState): boolean => {
  return hasThinking(message) && !message.isComplete;
};

/**
 * Get search tool calls from a message
 */
export const getSearchToolCalls = (message: MessageState): ToolCall[] => {
  return (
    message.toolCalls?.filter((tc: ToolCall) => tc.toolName === "webSearch") ||
    []
  );
};

/**
 * Get search results from a message
 */
export const getSearchResults = (message: MessageState): SearchResult[] => {
  const searchToolCalls = getSearchToolCalls(message);
  return searchToolCalls.length > 0
    ? (searchToolCalls[0]?.result as SearchResult[]) || []
    : [];
};

/**
 * Get URLs from search results
 */
export const getSearchUrls = (message: MessageState): string[] => {
  const searchResults = getSearchResults(message);
  return searchResults
    .map((result: SearchResult) => result.url)
    .filter(Boolean);
};
