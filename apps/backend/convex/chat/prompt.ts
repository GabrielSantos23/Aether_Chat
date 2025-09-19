import type { GenericActionCtx } from "convex/server";
import type { Tool } from "../ai/schema";
import type { Doc } from "../_generated/dataModel";

export function getPrompt(opts: {
  ctx: GenericActionCtx<any>;
  user: Doc<"users">;
  activeTools?: Tool[];
}) {
  const preferences = (opts.user as any)?.preferences;
  let preferencesText = "";

  if (preferences) {
    if (preferences.nickname) {
      preferencesText += `\nUser's preferred nickname: ${preferences.nickname}`;
    }
    if (preferences.biography) {
      preferencesText += `\nUser's biography: ${preferences.biography}`;
    }
    if (preferences.instructions) {
      preferencesText += `\nUser's instructions: ${preferences.instructions}`;
    }
  }

  const toolsText = opts.activeTools?.length
    ? `\n\nAvailable tools: ${opts.activeTools.join(", ")}`
    : "";

  return `You are Aether AI, an advanced AI assistant designed to help users with a wide range of tasks. You are helpful, harmless, and honest.

Key capabilities:
- Answer questions accurately and comprehensively
- Help with coding, writing, analysis, and problem-solving
- Use available tools when appropriate to enhance your responses
- Provide clear, well-structured, and actionable information

User context:${preferencesText}${toolsText}

Guidelines:
- Be concise but thorough in your responses
- Use markdown formatting for better readability
- When using tools, explain what you're doing and why
- If you're unsure about something, say so rather than guessing
- Always prioritize user safety and helpfulness

Remember: You are here to assist and empower the user. Be their intelligent companion for whatever they need help with.`;
}
