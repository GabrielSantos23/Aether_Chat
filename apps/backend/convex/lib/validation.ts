/**
 * Validation utilities for Convex mutations and actions
 */

import { z } from "zod";

// Message validation schemas
export const messageContentSchema = z
  .string()
  .max(10000, "Message content is too long (max 10,000 characters)")
  .trim();

export const messageRoleSchema = z.enum(["user", "assistant"]);

export const attachmentSchema = z.object({
  name: z.string().min(1, "Attachment name is required"),
  type: z.string().min(1, "Attachment type is required"),
  size: z
    .number()
    .min(0, "Attachment size must be positive")
    .max(50 * 1024 * 1024, "File size must be less than 50MB"),
  url: z.string().url("Attachment URL must be valid"),
});

export const toolCallSchema = z.object({
  toolCallId: z.string().min(1, "Tool call ID is required"),
  toolName: z.string().min(1, "Tool name is required"),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
});

export const chatTitleSchema = z
  .string()
  .min(1, "Chat title is required")
  .max(200, "Chat title is too long")
  .trim();

export const apiKeyServiceSchema = z.enum([
  "gemini",
  "groq",
  "openrouter",
  "moonshot",
  "deepgram",
]);

export const apiKeySchema = z.object({
  service: apiKeyServiceSchema,
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "API key name is too long"),
  key: z.string().min(1, "API key is required"),
  is_default: z.boolean().optional(),
});

export const mainFontSchema = z.enum([
  "inter",
  "system",
  "serif",
  "mono",
  "roboto-slab",
]);
export const codeFontSchema = z.enum([
  "fira-code",
  "mono",
  "consolas",
  "jetbrains",
  "source-code-pro",
]);
export const sendBehaviorSchema = z.enum(["enter", "shiftEnter", "button"]);

export const userSettingsSchema = z.object({
  userName: z
    .string()
    .min(1, "User name is required")
    .max(100, "User name is too long")
    .optional(),
  userRole: z.string().max(50, "User role is too long").optional(),
  userTraits: z.array(z.string()).optional(),
  userAdditionalInfo: z
    .string()
    .max(1000, "Additional info is too long")
    .optional(),
  promptTemplate: z
    .string()
    .max(5000, "Prompt template is too long")
    .optional(),
  mainFont: mainFontSchema.optional(),
  codeFont: codeFontSchema.optional(),
  sendBehavior: sendBehaviorSchema.optional(),
  autoSave: z.boolean().optional(),
  showTimestamps: z.boolean().optional(),
  disabledModels: z.array(z.string()).optional(),
  mem0Enabled: z.boolean().optional(),
  observations: z.array(z.string()).optional(),
});

// Validation helper functions
export function validateMessageContent(content: unknown): string {
  const result = messageContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(
      `Invalid message content: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

export function validateMessageRole(role: unknown): "user" | "assistant" {
  const result = messageRoleSchema.safeParse(role);
  if (!result.success) {
    throw new Error(
      `Invalid message role: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

export function validateAttachments(attachments: unknown) {
  const result = z.array(attachmentSchema).safeParse(attachments);
  if (!result.success) {
    throw new Error(
      `Invalid attachments: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

export function validateToolCalls(toolCalls: unknown) {
  const result = z.array(toolCallSchema).safeParse(toolCalls);
  if (!result.success) {
    throw new Error(
      `Invalid tool calls: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

export function validateChatTitle(title: unknown): string {
  const result = chatTitleSchema.safeParse(title);
  if (!result.success) {
    throw new Error(
      `Invalid chat title: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

export function validateApiKey(data: unknown) {
  const result = apiKeySchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid API key: ${result.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  return result.data;
}

export function validateUserSettings(data: unknown) {
  const result = userSettingsSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid user settings: ${result.error.issues
        .map((e) => e.message)
        .join(", ")}`
    );
  }
  return result.data;
}

// Generic validation wrapper for mutations
export function withValidation<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
  handler: (ctx: any, args: T) => Promise<any>
) {
  return async (ctx: any, args: unknown) => {
    const validationResult = schema.safeParse(args);
    if (!validationResult.success) {
      throw new Error(
        `Validation failed: ${validationResult.error.issues
          .map((e) => e.message)
          .join(", ")}`
      );
    }
    return handler(ctx, validationResult.data);
  };
}
