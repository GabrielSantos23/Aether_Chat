// QUERIES - for real-time subscriptions
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { getOrCreateUserId } from "./shared";

export const getChatMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      throw new Error("User not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    // Get messages ordered by creation time
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();

    return messages;
  },
});

export const getMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const message = await ctx.db.get(messageId);
    if (!message) {
      return null;
    }

    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      throw new Error("User not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    return message;
  },
});

export const getUserChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get the user ID
    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      return []; // Return empty array if user not found
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return chats;
  },
});

export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the user ID
    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      return null; // Return null if user not found
    }

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      return null; // Return null instead of throwing error
    }

    return chat;
  },
});

export const getUserAttachments = query({
  args: {},
  handler: async (ctx) => {
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

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const chatIds = chats.map((c) => c._id);
    const allAttachments: any[] = [];

    for (const chatId of chatIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chatId))
        .collect();

      messages.forEach((msg) => {
        if (msg.attachments && msg.attachments.length > 0) {
          allAttachments.push(...msg.attachments);
        }
      });
    }

    return allAttachments;
  },
});

export const getSharedChat = query({
  args: { shareId: v.string() },
  handler: async (ctx, { shareId }) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
      .unique();

    if (!chat || !chat.isShared) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", chat._id))
      .order("asc")
      .collect();

    return { chat, messages };
  },
});

export const listChats = query({
  args: {
    isBranch: v.optional(v.boolean()),
  },
  handler: async (ctx, { isBranch }) => {
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

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isBranch"), isBranch))
      .order("desc")
      .collect();

    return Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .order("desc")
          .first();
        return {
          ...chat,
          lastMessageContent: lastMessage?.content,
          lastMessageTimestamp: lastMessage?._creationTime,
        };
      })
    );
  },
});

export const exportAllConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    if (!userId) {
      throw new Error("User not found");
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const allMessages = await Promise.all(
      chats.map((chat) =>
        ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .collect()
      )
    );

    return {
      chats,
      messages: allMessages.flat(),
    };
  },
});

export const getUserAIGeneratedImages = query({
  args: {},
  handler: async (ctx) => {
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
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const chatIds = chats.map((c) => c._id);
    const aiImages: any[] = [];
    for (const chatId of chatIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("role"), "assistant"))
        .collect();
      messages.forEach((msg) => {
        if (msg.attachments && msg.attachments.length > 0) {
          aiImages.push(
            ...msg.attachments.filter(
              (a: any) => a.type && a.type.startsWith("image")
            )
          );
        }
      });
    }
    return aiImages;
  },
});

export const getUserAIImages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = await getOrCreateUserId(
      ctx,
      identity.tokenIdentifier,
      identity.email
    );
    const images = await ctx.db
      .query("aiImages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return images;
  },
});
