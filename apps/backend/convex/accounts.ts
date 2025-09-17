import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const getGoogleAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "google") ?? null;
  },
});

export const upsertAccount = mutation({
  args: {
    type: v.union(
      v.literal("email"),
      v.literal("oidc"),
      v.literal("oauth"),
      v.literal("webauthn")
    ),
    provider: v.string(),
    providerAccountId: v.string(),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    refresh_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure the caller is authenticated and resolve a Convex userId from identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Try to find existing user by email; create if missing
    let userId: Id<"users"> | null = null;
    let existingUser: any = null;
    if (identity.email) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email!))
        .first();
      if (existingUser) {
        userId = existingUser._id as Id<"users">;
      }
    }
    if (!userId) {
      const newUser: any = {
        name: identity.name || "User",
        email: identity.email || "user@example.com",
        image: identity.picture || "",
      };
      if (
        identity.tokenIdentifier &&
        typeof identity.tokenIdentifier === "string"
      ) {
        newUser.tokenIdentifier = identity.tokenIdentifier;
      }
      userId = await ctx.db.insert("users", newUser);
    } else {
      // Update existing user with latest profile fields if changed
      const updates: Partial<{ name: string; image: string }> = {};
      if (
        typeof identity.name === "string" &&
        identity.name !== existingUser?.name
      ) {
        updates.name = identity.name;
      }
      if (
        typeof identity.picture === "string" &&
        identity.picture !== existingUser?.image
      ) {
        updates.image = identity.picture;
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(userId, updates as any);
      }
    }

    // Insert or update existing account by composite key (provider, providerAccountId)
    const existing = await ctx.db
      .query("accounts")
      .withIndex("providerAndAccountId", (q) =>
        q
          .eq("provider", args.provider)
          .eq("providerAccountId", args.providerAccountId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        type: args.type,
        access_token: args.access_token,
        expires_at: args.expires_at,
        refresh_token: args.refresh_token,
        scope: args.scope,
        token_type: args.token_type,
        id_token: args.id_token,
        session_state: args.session_state,
      });
      return existing._id as Id<"accounts">;
    }

    return await ctx.db.insert("accounts", { ...args, userId });
  },
});

export const checkGoogleTokenStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "error", message: "Not authenticated" };

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const googleAccount = accounts.find((a) => a.provider === "google");

    if (!googleAccount) {
      return { status: "error", message: "Google account not connected" };
    }

    const now = Math.floor(Date.now() / 1000);

    const isExpired =
      googleAccount.expires_at && googleAccount.expires_at < now;

    const hasRefreshToken = !!googleAccount.refresh_token;

    const scopes = googleAccount.scope?.split(" ") ?? [];
    const hasDriveScope = scopes.some((scope) =>
      scope.includes("https://www.googleapis.com/auth/drive")
    );

    return {
      status: "success",
      isExpired: isExpired,
      expiresIn: googleAccount.expires_at
        ? googleAccount.expires_at - now
        : "unknown",
      hasRefreshToken: hasRefreshToken,
      hasDriveScope: hasDriveScope,
      scopes: scopes,
      tokenLength: googleAccount.access_token?.length || 0,
    };
  },
});

export const updateGoogleTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    refresh_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

export const deleteGoogleAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;

    const googleAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then(
        (accounts) => accounts.find((a) => a.provider === "google") ?? null
      );

    if (!googleAccount) return;

    await ctx.db.delete(googleAccount._id);
  },
});

export const getNotionAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "notion") ?? null;
  },
});

export const updateNotionTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    refresh_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

export const deleteNotionAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;
    const notionAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then(
        (accounts) => accounts.find((a) => a.provider === "notion") ?? null
      );

    if (!notionAccount) return;
    await ctx.db.delete(notionAccount._id);
  },
});

export const getGitHubAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "github") ?? null;
  },
});

export const updateGitHubTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

export const deleteGitHubAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;
    const ghAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then((acc) => acc.find((a) => a.provider === "github") ?? null);

    if (!ghAccount) return;
    await ctx.db.delete(ghAccount._id);
  },
});
