/**
 * Zod validation schemas for input validation
 */

import { z } from "zod";

// Message validation schemas
export const messageContentSchema = z
  .string()
  .min(1, "Message content cannot be empty")
  .max(10000, "Message content is too long (max 10,000 characters)")
  .trim();

export const messageRoleSchema = z.enum(["user", "assistant"]);

export const attachmentSchema = z.object({
  name: z.string().min(1, "Attachment name is required"),
  type: z.string().min(1, "Attachment type is required"),
  size: z.number().min(0, "Attachment size must be positive"),
  url: z.string().url("Attachment URL must be valid"),
});

export const toolCallSchema = z.object({
  toolCallId: z.string().min(1, "Tool call ID is required"),
  toolName: z.string().min(1, "Tool name is required"),
  args: z.record(z.unknown()),
  result: z.unknown().optional(),
});

export const messageSchema = z.object({
  _id: z.string().min(1, "Message ID is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  role: messageRoleSchema,
  content: messageContentSchema,
  modelId: z.string().optional(),
  thinking: z.string().optional(),
  thinkingDuration: z.number().optional(),
  isComplete: z.boolean().optional(),
  isCancelled: z.boolean().optional(),
  attachments: z.array(attachmentSchema).optional(),
  toolCalls: z.array(toolCallSchema).optional(),
  createdAt: z.number(),
});

// Upload validation schemas
export const uploadedFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z
    .number()
    .min(0, "File size must be positive")
    .max(50 * 1024 * 1024, "File size must be less than 50MB"),
  type: z.string().min(1, "File type is required"),
  url: z.string().url("File URL must be valid"),
  key: z.string().min(1, "File key is required"),
});

export const fileUploadSchema = z.object({
  files: z.array(uploadedFileSchema).max(10, "Maximum 10 files allowed"),
});

// Settings validation schemas
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
  userId: z.string().min(1, "User ID is required"),
  uploadthing_key: z.string().optional(),
  tavily_key: z.string().optional(),
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

// API key validation schemas
export const apiKeyServiceSchema = z.enum([
  "gemini",
  "groq",
  "openrouter",
  "moonshot",
  "deepgram",
]);

export const apiKeySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  service: apiKeyServiceSchema,
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "API key name is too long"),
  key: z.string().min(1, "API key is required"),
  is_default: z.boolean().optional(),
});

// Chat validation schemas
export const chatSchema = z.object({
  _id: z.string().min(1, "Chat ID is required"),
  userId: z.string().min(1, "User ID is required"),
  title: z
    .string()
    .min(1, "Chat title is required")
    .max(200, "Chat title is too long"),
  createdAt: z.number(),
  updatedAt: z.number(),
  shareId: z.string().optional(),
  isShared: z.boolean().optional(),
  isGeneratingTitle: z.boolean().optional(),
  isBranch: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

// Research validation schemas
export const researchActionSchema = z.object({
  type: z.enum(["search", "read"]),
  toolCallId: z.string().min(1, "Tool call ID is required"),
  thoughts: z.string().min(1, "Thoughts are required"),
  query: z.string().optional(),
  url: z.string().url().optional(),
  timestamp: z.number(),
});

export const researchSessionSchema = z.object({
  _id: z.string().min(1, "Research session ID is required"),
  userId: z.string().min(1, "User ID is required"),
  prompt: z
    .string()
    .min(1, "Research prompt is required")
    .max(2000, "Research prompt is too long"),
  thoughts: z.string().min(1, "Research thoughts are required"),
  status: z.enum(["running", "completed", "failed"]),
  summary: z.string().optional(),
  actions: z.array(researchActionSchema),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});

// Form input validation schemas
export const promptInputSchema = z.object({
  content: messageContentSchema,
  attachments: z.array(attachmentSchema).optional(),
  modelId: z.string().optional(),
});

export const chatTitleSchema = z.object({
  title: z
    .string()
    .min(1, "Chat title is required")
    .max(200, "Chat title is too long"),
});

// Validation helper functions
export function validateMessage(data: unknown) {
  return messageSchema.safeParse(data);
}

export function validateUploadedFile(data: unknown) {
  return uploadedFileSchema.safeParse(data);
}

export function validateUserSettings(data: unknown) {
  return userSettingsSchema.safeParse(data);
}

export function validateApiKey(data: unknown) {
  return apiKeySchema.safeParse(data);
}

export function validateChat(data: unknown) {
  return chatSchema.safeParse(data);
}

export function validateResearchSession(data: unknown) {
  return researchSessionSchema.safeParse(data);
}

export function validatePromptInput(data: unknown) {
  return promptInputSchema.safeParse(data);
}

// Error formatting helper
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map((error) => {
    const path = error.path.length > 0 ? `${error.path.join(".")}: ` : "";
    return `${path}${error.message}`;
  });
}
