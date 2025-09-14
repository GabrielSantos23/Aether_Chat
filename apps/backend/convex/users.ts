import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get a user by their ID.
 *
 * @param {Id<"users">} id - The ID of the user to fetch.
 * @returns {Promise<Doc<"users"> | null>} - The user document or null if not found.
 */
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Fetches a user document from the 'users' table using the provided ID.
    const user = await ctx.db.get(args.id);
    return user;
  },
});

/**
 * Get the settings for the currently authenticated user.
 *
 * This query retrieves the user's settings from the 'userSettings' table using the 'by_user' index.
 * It requires the user to be authenticated.
 *
 * @returns {Promise<Doc<"userSettings"> | null>} - The user settings document or null if not authenticated or has no settings.
 */
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
 * Create or update settings for the currently authenticated user.
 *
 * This mutation allows an authenticated user to update their personal settings.
 * If settings for the user do not exist, a new document will be created.
 * Otherwise, the existing document will be patched with the new values.
 */
export const updateUserSettings = mutation({
  // Define the arguments that can be passed to this mutation.
  // All arguments are optional, allowing for partial updates.
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

    // Separate control fields from actual settings
    const { action, existing_knowledge_id, ...incomingSettings } = args as any;

    // Check if user settings already exist using the 'by_user' index.
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (action === "delete") {
      // If deletion requested, clear provided fields
      if (existingSettings) {
        const fieldsToClear: any = {};
        for (const key of Object.keys(incomingSettings)) {
          // Only clear if the field exists in schema
          fieldsToClear[key] = undefined;
        }
        if (Object.keys(fieldsToClear).length > 0) {
          await ctx.db.patch(existingSettings._id, fieldsToClear);
        }
      }
      return;
    }

    if (existingSettings) {
      // Merge observations uniquely if provided
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
      // If settings exist, patch the document with the new arguments.
      await ctx.db.patch(existingSettings._id, patchArgs);
    } else {
      // If settings do not exist, create a new document.
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
  // TODO: implement real credit checking logic; currently always returns true
  return true;
}

/**
 * Get sessions for the currently authenticated user.
 */
export const getMySessions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("[getMySessions] No identity found");
      return [];
    }

    const userId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!userId) {
      console.log("[getMySessions] No userId resolved");
      return [];
    }

    console.log("[getMySessions] Looking for sessions with userId:", userId);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("userId", (q) => q.eq("userId", String(userId)))
      .collect();

    console.log("[getMySessions] Found sessions:", sessions.length);

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

/**
 * Revoke a session by its token for the current user.
 */
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

    // Ensure the session belongs to the current user
    const currentUserId = await resolveOrCreateCurrentUserId(ctx, identity);
    if (!currentUserId || String(session.userId) !== String(currentUserId)) {
      throw new Error("Forbidden");
    }

    await ctx.db.delete(session._id);
    return true;
  },
});

/**
 * Update the current user's display name.
 */
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

/**
 * Get subscription status and usage limits for the current user.
 */
export const getSubscriptionAndUsage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        isPro: false,
        subscriptionStatus: "free",
        limits: {
          CREDITS: 10, // Guest limit
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
          CREDITS: 20, // User limit
          SEARCH: 10,
          RESEARCH: 5,
        },
        remainingCredits: 20,
        remainingSearches: 10,
        remainingResearches: 5,
        isExpiring: false,
      };
    }

    // Get user settings to check pro status
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const isPro = userSettings?.userRole === "pro";

    // Get message usage
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

    // Get research usage
    const researchUsage = await ctx.db
      .query("user_usage")
      .withIndex("by_user", (q) => q.eq("userId", String(userId)))
      .first();

    const now = Date.now();
    const WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

    // Calculate remaining credits
    let remainingCredits = isPro ? Infinity : 20;
    if (!isPro && messageUsage) {
      if (now - messageUsage.windowStart >= WINDOW_MS) {
        remainingCredits = 20; // Reset window
      } else {
        remainingCredits = Math.max(0, 20 - messageUsage.count);
      }
    }

    // Calculate remaining research
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
      remainingSearches: isPro ? Infinity : 10, // Simplified for now
      remainingResearches,
      isExpiring: false, // Would need subscription data to determine this
    };
  },
});

/**
 * Test function to create a session manually for debugging
 */
export const createTestSession = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    console.log(
      "[createTestSession] Creating test session for userId:",
      userId
    );

    const sessionData = {
      userId,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      sessionToken: `test-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      createdAt: Date.now(),
    };

    const sessionId = await ctx.db.insert("sessions", sessionData);
    console.log("[createTestSession] Test session created with ID:", sessionId);
    return sessionId;
  },
});

/**
 * Resolve current Convex user Id from identity; create a minimal user if missing.
 */
async function resolveOrCreateCurrentUserId(
  ctx: any,
  identity: { tokenIdentifier?: string; email?: string | null }
): Promise<Id<"users"> | null> {
  console.log("[resolveOrCreateCurrentUserId] Identity:", {
    tokenIdentifier: identity.tokenIdentifier,
    email: identity.email,
  });

  // Try by tokenIdentifier
  if (identity.tokenIdentifier) {
    const byToken = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier!)
      )
      .first();
    if (byToken) {
      console.log(
        "[resolveOrCreateCurrentUserId] Found user by token:",
        byToken._id
      );
      return byToken._id;
    }
  }

  // Try by email
  if (identity.email) {
    const byEmail = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email))
      .first();
    if (byEmail) {
      console.log(
        "[resolveOrCreateCurrentUserId] Found user by email:",
        byEmail._id
      );
      // Backfill tokenIdentifier if present, but only in mutation/action contexts
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

  // Create minimal record if possible
  const email = identity.email || "user@example.com";
  console.log(
    "[resolveOrCreateCurrentUserId] Creating new user with email:",
    email
  );
  const userId: Id<"users"> = await ctx.db.insert("users", {
    name: "User",
    email,
    image: "",
    tokenIdentifier: identity.tokenIdentifier,
  });
  console.log("[resolveOrCreateCurrentUserId] Created new user:", userId);
  return userId;
}

// Helper functions for action contexts
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
