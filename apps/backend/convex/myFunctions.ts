import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const storeUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!existingUser) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();
    }

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        tokenIdentifier: args.tokenIdentifier,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        image: args.image,
        tokenIdentifier: args.tokenIdentifier,
      });
    }
  },
});

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const email = identity.email;
    if (!email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const email = identity.email || "";

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
    }

    if (!user) {
      throw new Error("User not found");
    }
  },
});

export const updateUserTokenIdentifier = mutation({
  args: {
    email: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        email: args.email,
        tokenIdentifier: args.tokenIdentifier,
      });
      return user._id;
    }

    return null;
  },
});
