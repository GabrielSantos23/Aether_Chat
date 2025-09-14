import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// Store or update user information in the database
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

    // First check if user already exists by tokenIdentifier
    let existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    // If not found by tokenIdentifier, try to find by email
    if (!existingUser) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();
    }

    if (existingUser) {
      // Update existing user and ensure tokenIdentifier is updated
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        tokenIdentifier: args.tokenIdentifier,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        image: args.image,
        tokenIdentifier: args.tokenIdentifier,
      });
    }
  },
});

// Get the current user from the database
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get email from identity
    const email = identity.email;
    if (!email) {
      return null;
    }

    // Look up user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

// List todos for the current user
export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const email = identity.email || "";

    // Get user from database
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    // If not found by tokenIdentifier, try to find by email if we have one
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

// Update a user's tokenIdentifier
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

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // Update the tokenIdentifier
      await ctx.db.patch(user._id, {
        email: args.email,
        tokenIdentifier: args.tokenIdentifier,
      });
      return user._id;
    }

    return null;
  },
});
