import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

async function getOrCreateUserId(
  ctx: MutationCtx | QueryCtx,
  tokenIdentifier: string
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .first();

  if (user) {
    return user._id;
  }

  const userByEmail = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", tokenIdentifier))
    .first();

  if (userByEmail) {
    return userByEmail._id;
  }

  if ("query" in ctx.db && !("insert" in ctx.db)) {
    return null;
  }

  const userId = await (ctx.db as MutationCtx["db"]).insert("users", {
    name: "User",
    email: tokenIdentifier,
    image: "",
    tokenIdentifier: tokenIdentifier,
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
      return [];
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
      return false;
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
      const existingKey = await ctx.db.get(_id);
      if (!existingKey || existingKey.userId !== userId)
        throw new Error("Not authorized to edit this key");
      await ctx.db.patch(_id, { name, key });
    } else {
      const existingKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_user_and_service", (q) =>
          q.eq("userId", userId).eq("service", service)
        )
        .collect();

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

    if (wasDefault) {
      const remainingKeys = await ctx.db
        .query("apiKeys")
        .withIndex("by_user_and_service", (q) =>
          q.eq("userId", userId).eq("service", existingKey.service)
        )
        .collect();

      if (remainingKeys.length > 0) {
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
      return null;
    }

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
      return [];
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

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userSettings) {
      await ctx.db.patch(userSettings._id, { disabledModels });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        disabledModels,
      });
    }
  },
});
