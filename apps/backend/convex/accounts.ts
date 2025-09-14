import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
