import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOneFrom } from "convex-helpers/server/relationships";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Helper function to get or create a user record
async function getOrCreateUserId(
  ctx: MutationCtx | QueryCtx,
  tokenIdentifier: string
) {
  // First, try to find the user by tokenIdentifier
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", tokenIdentifier))
    .first();

  if (user) {
    return user._id;
  }

  // If we're in a query context, we can't create a user
  if ("query" in ctx.db && !("insert" in ctx.db)) {
    // Instead of throwing an error, return null to indicate user not found
    return null;
  }

  // If user doesn't exist, create a minimal user record
  // This is a fallback and should be properly handled in user onboarding
  const userId = await (ctx.db as MutationCtx["db"]).insert("users", {
    name: "User",
    email: tokenIdentifier, // This should be updated with actual user data
    image: "",
  });

  return userId;
}

export const getApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      return []; // Return empty array if user not found
    }

    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user_and_service", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const hasApiKeyForProvider = query({
  args: {
    provider: v.union(
      v.literal("gemini"),
      v.literal("groq"),
      v.literal("openrouter"),
      v.literal("moonshot"),
      v.literal("deepgram")
    ),
  },
  handler: async (ctx, { provider }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      return false; // Return false if user not found
    }

    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_and_service", (q) =>
        q.eq("userId", userId).eq("service", provider)
      )
      .first();

    return !!apiKey;
  },
});

export const saveApiKey = mutation({
  args: {
    _id: v.optional(v.id("apiKeys")),
    name: v.string(),
    service: v.union(
      v.literal("gemini"),
      v.literal("groq"),
      v.literal("openrouter"),
      v.literal("moonshot"),
      v.literal("deepgram")
    ),
    key: v.string(),
  },
  handler: async (ctx, { _id, name, service, key }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      throw new Error("User not found");
    }

    if (_id) {
      // It's an update
      const existingKey = await ctx.db.get(_id);
      if (!existingKey || existingKey.userId !== userId)
        throw new Error("Not authorized to edit this key");
      await ctx.db.patch(_id, { name, key });
    } else {
      // It's a new key - check if this is the first key for this service
      const existingKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_user_and_service", (q) =>
          q.eq("userId", userId).eq("service", service)
        )
        .collect();

      // If this is the first key for this service, make it default
      const isFirstKey = existingKeys.length === 0;

      await ctx.db.insert("apiKeys", {
        userId,
        name,
        service,
        key,
        is_default: isFirstKey,
      });
    }
  },
});

export const deleteApiKey = mutation({
  args: { _id: v.id("apiKeys") },
  handler: async (ctx, { _id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      throw new Error("User not found");
    }

    const existingKey = await ctx.db.get(_id);
    if (!existingKey || existingKey.userId !== userId)
      throw new Error("Not authorized to delete this key");

    const wasDefault = existingKey.is_default;
    await ctx.db.delete(_id);

    // If we deleted the default key, set another key as default
    if (wasDefault) {
      const remainingKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_user_and_service", (q) =>
          q.eq("userId", userId).eq("service", existingKey.service)
        )
        .collect();

      if (remainingKeys.length > 0) {
        // Set the first remaining key as default
        await ctx.db.patch(remainingKeys[0]._id, { is_default: true });
      }
    }
  },
});

export const setDefaultApiKey = mutation({
  args: { _id: v.id("apiKeys") },
  handler: async (ctx, { _id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      throw new Error("User not found");
    }

    const targetKey = await ctx.db.get(_id);
    if (!targetKey || targetKey.userId !== userId)
      throw new Error("Key not found or not authorized");

    // Unset any other default key for the same service
    const otherDefaults = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_and_service", (q) =>
        q.eq("userId", userId).eq("service", targetKey.service)
      )
      .filter((q) => q.eq(q.field("is_default"), true))
      .collect();

    for (const key of otherDefaults) {
      await ctx.db.patch(key._id, { is_default: false });
    }

    // Set the new default
    await ctx.db.patch(_id, { is_default: true });
  },
});

export const getUserDefaultApiKey = query({
  args: {
    service: v.union(
      v.literal("gemini"),
      v.literal("groq"),
      v.literal("openrouter"),
      v.literal("moonshot"),
      v.literal("deepgram")
    ),
  },
  handler: async (ctx, { service }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      return null; // Return null if user not found
    }

    // First try to get the default key
    const defaultKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_and_service", (q) =>
        q.eq("userId", userId).eq("service", service)
      )
      .filter((q) => q.eq(q.field("is_default"), true))
      .first();

    if (defaultKey) {
      return defaultKey.key;
    }

    // If no default key, get any key for the service
    const anyKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_and_service", (q) =>
        q.eq("userId", userId).eq("service", service)
      )
      .first();

    return anyKey?.key || null;
  },
});

export const getDisabledModels = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      return []; // Return empty array if user not found
    }

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return userSettings?.disabledModels || [];
  },
});

export const updateDisabledModels = mutation({
  args: {
    disabledModels: v.array(v.string()),
  },
  handler: async (ctx, { disabledModels }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    if (!userId) {
      throw new Error("User not found");
    }

    // Check if user settings exist
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userSettings) {
      // Update existing settings
      await ctx.db.patch(userSettings._id, { disabledModels });
    } else {
      // Create new settings
      await ctx.db.insert("userSettings", {
        userId,
        disabledModels,
      });
    }
  },
});
