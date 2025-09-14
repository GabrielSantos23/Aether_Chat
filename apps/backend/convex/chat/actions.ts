import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { generateText, CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateAIResponse, getOrCreateUserId } from "./shared";
import { MutationCtx, QueryCtx } from "../_generated/server";

export const retryMessage = action({
  args: {
    chatId: v.id("chats"),
    fromMessageId: v.id("messages"),
    modelId: v.string(),
    webSearch: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { chatId, fromMessageId, modelId, webSearch }
  ): Promise<{
    success: boolean;
    assistantMessageId: Id<"messages">;
  }> => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Authentication required");
    }
    const chat = await ctx.runQuery(api.chat.queries.getChat, { chatId });
    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    try {
      await ctx.runMutation(api.chat.mutations.deleteMessagesFromIndex, {
        chatId,
        fromMessageId,
      });

      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId,
      });

      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      await generateAIResponse(ctx, chatMessages, modelId, assistantMessageId, {
        webSearch: webSearch || false,
        imageGeneration: false,
        research: false,
      });

      return {
        success: true,
        assistantMessageId,
      };
    } catch (error) {
      console.error("Error in retryMessage action:", error);

      await ctx.runMutation(api.chat.mutations.addMessage, {
        chatId,
        role: "assistant",
        content:
          "I apologize, but I encountered an error while retrying the message. Please try again.",
        modelId,
      });

      throw error;
    }
  },
});

export const editMessageAndRegenerate = action({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    modelId: v.string(),
    webSearch: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { messageId, content, modelId, webSearch }
  ): Promise<{
    success: boolean;
    assistantMessageId: Id<"messages">;
  }> => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const message = await ctx.runQuery(api.chat.queries.getMessage, {
      messageId,
    });
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.runQuery(api.chat.queries.getChat, {
      chatId: message.chatId,
    });
    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    if (message.role !== "user") {
      throw new Error("Only user messages can be edited");
    }

    try {
      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId,
        content,
      });

      const allMessages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId: message.chatId,
      });

      const editedMessageIndex = allMessages.findIndex(
        (msg: any) => msg._id === messageId
      );
      if (editedMessageIndex === -1) {
        throw new Error("Message not found in chat");
      }

      let nextAssistantMessageIndex = -1;
      for (let i = editedMessageIndex + 1; i < allMessages.length; i++) {
        if (allMessages[i].role === "assistant") {
          nextAssistantMessageIndex = i;
          break;
        }
      }

      if (nextAssistantMessageIndex !== -1) {
        const fromMessageId = allMessages[nextAssistantMessageIndex]._id;
        await ctx.runMutation(api.chat.mutations.deleteMessagesFromIndex, {
          chatId: message.chatId,
          fromMessageId,
        });
      }

      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId: message.chatId,
      });

      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId: message.chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      await generateAIResponse(ctx, chatMessages, modelId, assistantMessageId, {
        webSearch: webSearch || false,
        imageGeneration: false,
        research: false,
      });

      return {
        success: true,
        assistantMessageId,
      };
    } catch (error) {
      console.error("Error in editMessageAndRegenerate action:", error);

      await ctx.runMutation(api.chat.mutations.addMessage, {
        chatId: message.chatId,
        role: "assistant",
        content:
          "I apologize, but I encountered an error while processing your edited message. Please try again.",
        modelId,
      });

      throw error;
    }
  },
});

export const sendMessage = action({
  args: {
    chatId: v.id("chats"),
    message: v.string(),
    modelId: v.string(),
    anonKey: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          size: v.number(),
          url: v.string(),
        })
      )
    ),
    webSearch: v.optional(v.boolean()),
    imageGen: v.optional(v.boolean()),
    research: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    {
      chatId,
      message,
      modelId,
      anonKey,
      attachments,
      webSearch,
      imageGen,
      research,
    } // <-- Add research here
  ): Promise<{
    success: boolean;
    userMessageId: Id<"messages">;
    assistantMessageId: Id<"messages">;
  }> => {
    try {
      // Verify authentication and chat ownership first
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required");
      }

      const chat = await ctx.runQuery(api.chat.queries.getChat, { chatId });
      if (!chat) {
        throw new Error("Chat not found or access denied");
      }

      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId,
      });

      const isFirstMessage = messages.length === 0;

      // Rate limit: only count user-originated messages
      await ctx.runMutation(api.limits.checkAndConsumeMessageCredit, {
        anonKey,
      });

      const userMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "user",
          content: message,
          attachments,
        }
      );

      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      chatMessages.push({
        role: "user" as const,
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      });

      if ((attachments && attachments.length > 0) || imageGen) {
        return await ctx.runAction(api.chat.node.sendMessage, {
          chatMessages,
          modelId,
          attachments: attachments ?? [],
          message,
          assistantMessageId,
          webSearch,
          userMessageId,
          imageGen,
          research,
        });
      }

      try {
        await generateAIResponse(
          ctx,
          chatMessages,
          modelId,
          assistantMessageId,
          {
            webSearch: webSearch || false,
            imageGeneration: false,
            research: research || false,
          }
        );

        return {
          success: true,
          userMessageId,
          assistantMessageId,
        };
      } catch (error: any) {
        console.error(
          `Error generating response with model ${modelId}:`,
          error
        );

        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          content: `I apologize, but I couldn't generate a response. ${
            error.message
              ? `Error: ${error.message}`
              : "Please check your API keys in settings or try a different model."
          }`,
          isComplete: true,
        });

        throw error;
      }
    } catch (error: any) {
      console.error("Error in sendMessage action:", error);

      if (!error.message?.includes("API key")) {
        await ctx.runMutation(api.chat.mutations.addMessage, {
          chatId,
          role: "assistant",
          content:
            "I apologize, but I encountered an error while processing your message. Please try again.",
          modelId,
        });
      }

      throw error;
    }
  },
});

export const generateTitle = action({
  args: {
    chatId: v.id("chats"),
    messageContent: v.string(),
    modelId: v.string(),
  },
  handler: async (ctx, { chatId, messageContent, modelId }) => {
    try {
      const envApiKey = process.env.GEMINI_API_KEY || "";

      if (!envApiKey) {
        console.error("No Gemini API key available for title generation");
        await ctx.runMutation(api.chat.mutations.updateChatTitle, {
          chatId,
          title: "New chat",
        });
        return;
      }

      const google = createGoogleGenerativeAI({ apiKey: envApiKey });
      const aiModel = google("gemini-2.0-flash-lite");

      let titlePrompt = `Based on the following user message, generate a short, concise title for the chat (4-5 words max) No Markdown Allowed:\n\nUser: "${messageContent}"\n\nTitle:`;

      const { text } = await generateText({
        model: aiModel,
        prompt: titlePrompt,
      });

      let finalTitle = text || "New chat";

      finalTitle = finalTitle.replace(/"/g, "").trim();
      if (!finalTitle || finalTitle.length < 2) {
        finalTitle = "New chat";
      }

      await ctx.runMutation(api.chat.mutations.updateChatTitle, {
        chatId,
        title: finalTitle,
      });
    } catch (error) {
      console.error("Error generating title:", error);
      await ctx.runMutation(api.chat.mutations.updateChatTitle, {
        chatId,
        title: "New chat",
      });
    }
  },
});

export const searchChats = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx: QueryCtx, { searchQuery }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      return [];
    }

    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (searchQuery.trim() === "") {
      return userChats;
    }

    const filteredChats = userChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredChats;
  },
});
