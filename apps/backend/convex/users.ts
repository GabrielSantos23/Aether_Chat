import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return user;
  },
});

export const getMySettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn("User is not authenticated. Cannot fetch settings.");
      return null;
    }

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) return null;

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return userSettings;
  },
});

/**

 */
export const updateUserSettings = mutation({
  args: {
    uploadthing_key: v.optional(v.string()),
    tavily_key: v.optional(v.string()),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    userTraits: v.optional(v.array(v.string())),
    userAdditionalInfo: v.optional(v.string()),
    promptTemplate: v.optional(v.string()),
    mainFont: v.optional(
      v.union(
        v.literal("inter"),
        v.literal("system"),
        v.literal("serif"),
        v.literal("mono"),
        v.literal("roboto-slab")
      )
    ),
    codeFont: v.optional(
      v.union(
        v.literal("fira-code"),
        v.literal("mono"),
        v.literal("consolas"),
        v.literal("jetbrains"),
        v.literal("source-code-pro")
      )
    ),
    sendBehavior: v.optional(
      v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))
    ),
    autoSave: v.optional(v.boolean()),
    showTimestamps: v.optional(v.boolean()),
    disabledModels: v.optional(v.array(v.string())),
    mem0Enabled: v.optional(v.boolean()),
    observations: v.optional(v.array(v.string())),
    action: v.optional(
      v.union(v.literal("create"), v.literal("update"), v.literal("delete"))
    ),
    existing_knowledge_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to update settings.");
    }

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) throw new Error("Unable to resolve user");

    const { action, existing_knowledge_id, ...incomingSettings } = args as any;

    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (action === "delete") {
      if (existingSettings) {
        const fieldsToClear: any = {};
        for (const key of Object.keys(incomingSettings)) {
          fieldsToClear[key] = undefined;
        }
        if (Object.keys(fieldsToClear).length > 0) {
          await ctx.db.patch(existingSettings._id, fieldsToClear);
        }
      }
      return;
    }

    if (existingSettings) {
      let patchArgs: any = { ...incomingSettings };
      if (
        incomingSettings.observations &&
        incomingSettings.observations.length > 0
      ) {
        const existingObs = existingSettings.observations || [];
        const combined = Array.from(
          new Set([...existingObs, ...incomingSettings.observations])
        );
        patchArgs.observations = combined;
      }
      await ctx.db.patch(existingSettings._id, patchArgs);
    } else {
      await ctx.db.insert("userSettings", { userId, ...incomingSettings });
    }
  },
});

export const storeUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert("users", args);
    return user;
  },
});

export function checkUserCredits(ctx: any, user: any, cost: number): boolean {
  return true;
}

/**

 */
export const getMySessions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) {
      return [];
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("userId", (q) => q.eq("userId", String(userId)))
      .collect();

    return sessions.map((s) => ({
      id: s._id,
      sessionToken: s.sessionToken,
      userId: s.userId,
      expires: s.expires,
      createdAt: s.createdAt || s._creationTime,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      platform: s.platform,
    }));
  },
});

export const revokeSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("sessions")
      .withIndex("sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .unique();
    if (!session) return false;

    const currentUserId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!currentUserId || String(session.userId) !== String(currentUserId)) {
      throw new Error("Forbidden");
    }

    await ctx.db.delete(session._id);
    return true;
  },
});

export const updateMyName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) throw new Error("User not found");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { name });
  },
});

export const getSubscriptionAndUsage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        isPro: false,
        subscriptionStatus: "free",
        limits: {
          CREDITS: 10,
          SEARCH: 5,
          RESEARCH: 2,
        },
        remainingCredits: 10,
        remainingSearches: 5,
        remainingResearches: 2,
        isExpiring: false,
      };
    }

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) {
      return {
        isPro: false,
        subscriptionStatus: "free",
        limits: {
          CREDITS: 20,
          SEARCH: 10,
          RESEARCH: 5,
        },
        remainingCredits: 20,
        remainingSearches: 10,
        remainingResearches: 5,
        isExpiring: false,
      };
    }

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const isPro = userSettings?.userRole === "pro";

    let messageUsage = await ctx.db
      .query("messageUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!messageUsage && identity.tokenIdentifier) {
      messageUsage = await ctx.db
        .query("messageUsage")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .first();
    }

    const researchUsage = await ctx.db
      .query("user_usage")
      .withIndex("by_user", (q) => q.eq("userId", String(userId)))
      .first();

    const now = Date.now();
    const WINDOW_MS = 5 * 60 * 60 * 1000;

    let remainingCredits = isPro ? Infinity : 20;
    if (!isPro && messageUsage) {
      if (now - messageUsage.windowStart >= WINDOW_MS) {
        remainingCredits = 20;
      } else {
        remainingCredits = Math.max(0, 20 - messageUsage.count);
      }
    }

    const remainingResearches = isPro
      ? Infinity
      : 5 - (researchUsage?.research || 0);

    return {
      isPro,
      subscriptionStatus: isPro ? "pro" : "free",
      limits: {
        CREDITS: isPro ? Infinity : 20,
        SEARCH: isPro ? Infinity : 10,
        RESEARCH: isPro ? Infinity : 5,
      },
      remainingCredits,
      remainingSearches: isPro ? Infinity : 10,
      remainingResearches,
      isExpiring: false,
    };
  },
});

export const createTestSession = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const sessionData = {
      userId,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
      sessionToken: `test-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      createdAt: Date.now(),
    };

    const sessionId = await ctx.db.insert("sessions", sessionData);
    return sessionId;
  },
});

async function resolveOrCreateCurrentUserId(
  ctx: any,
  identity: { tokenIdentifier?: string; email?: string | null }
): Promise<Id<"users"> | null> {
  if (identity.tokenIdentifier) {
    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier!)
      )
      .first();
    if (byToken) {
      return byToken._id;
    }
  }

  if (identity.email) {
    const byEmail = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email))
      .first();
    if (byEmail) {
      if (
        identity.tokenIdentifier &&
        !byEmail.tokenIdentifier &&
        typeof (ctx.db as any).patch === "function"
      ) {
        await (ctx.db as any).patch(byEmail._id, {
          tokenIdentifier: identity.tokenIdentifier,
        });
      }
      return byEmail._id;
    }
  }

  // Check if we're in a query context (read-only)
  if ("query" in ctx.db && !("insert" in ctx.db)) {
    return null;
  }

  // We're in a mutation context, can create the user
  const email = identity.email || "user@example.com";

  const userId: Id<"users"> = await ctx.db.insert("users", {
    name: "User",
    email,
    image: "",
    tokenIdentifier: identity.tokenIdentifier,
  });
  return userId;
}

export const getUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
    return user;
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    return user;
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      tokenIdentifier: args.tokenIdentifier,
    });
    return userId;
  },
});

export const updateUserToken = mutation({
  args: {
    userId: v.id("users"),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, { userId, tokenIdentifier }) => {
    await ctx.db.patch(userId, { tokenIdentifier });
    return userId;
  },
});
