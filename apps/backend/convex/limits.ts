import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findUser, getOrCreateUserId } from "./chat/shared";

// Window configuration: 5 hours in milliseconds
const WINDOW_MS = 5 * 60 * 60 * 1000;

// Limits
const GUEST_LIMIT = 10; // per window
const USER_LIMIT = 20; // per window (non-pro)

export const getStatus = query({
  args: {
    anonKey: v.optional(v.string()),
  },
  handler: async (ctx, { anonKey }) => {
    const identity = await ctx.auth.getUserIdentity();

    const now = Date.now();

    if (identity) {
      // Logged-in user
      // Determine role
      const user = await findUser(ctx, {
        tokenIdentifier: identity.tokenIdentifier || "",
        email: identity.email || undefined,
      });
      const userConvexId = user?._id;

      // Only check settings if we have a user document
      const userSettings = userConvexId
        ? await ctx.db
            .query("userSettings")
            .withIndex("by_user", (q) => q.eq("userId", userConvexId as any))
            .unique()
        : null;

      const isPro = userSettings?.userRole === "pro";
      if (isPro) {
        return { role: "pro", allowed: true, remaining: Infinity } as any;
      }

      // Prefer lookup by userId; fallback to tokenIdentifier
      let usage = userConvexId
        ? await ctx.db
            .query("messageUsage")
            .withIndex("by_user", (q) => q.eq("userId", userConvexId as any))
            .first()
        : null;

      if (!usage && identity.tokenIdentifier) {
        usage = await ctx.db
          .query("messageUsage")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier || "")
          )
          .first();
      }

      if (!usage || now - usage.windowStart >= WINDOW_MS) {
        return { role: "user", allowed: true, remaining: USER_LIMIT };
      }

      return {
        role: "user",
        allowed: usage.count < USER_LIMIT,
        remaining: Math.max(0, USER_LIMIT - usage.count),
      };
    } else {
      // Guest
      if (!anonKey) {
        // Without anonKey we can't track reliably; deny by default
        return { role: "guest", allowed: false, remaining: 0 };
      }

      const usage = await ctx.db
        .query("messageUsage")
        .withIndex("by_anon", (q) => q.eq("anonKey", anonKey))
        .first();

      if (!usage || now - usage.windowStart >= WINDOW_MS) {
        return { role: "guest", allowed: true, remaining: GUEST_LIMIT };
      }

      return {
        role: "guest",
        allowed: usage.count < GUEST_LIMIT,
        remaining: Math.max(0, GUEST_LIMIT - usage.count),
      };
    }
  },
});

export const checkAndConsumeMessageCredit = mutation({
  args: {
    anonKey: v.optional(v.string()),
  },
  handler: async (ctx, { anonKey }) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();

    if (identity) {
      // Check role for pro users
      const userConvexId = await getOrCreateUserId(
        ctx,
        identity.tokenIdentifier || "",
        identity.email || undefined
      );

      const userSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("userId", userConvexId as any))
        .unique();

      const isPro = userSettings?.userRole === "pro";
      if (isPro) {
        return { allowed: true, remaining: Infinity } as any;
      }

      // Non-pro user: enforce USER_LIMIT per window
      const tokenIdentifier = identity.tokenIdentifier || "";
      let usage = await ctx.db
        .query("messageUsage")
        .withIndex("by_user", (q) => q.eq("userId", userConvexId as any))
        .first();

      if (!usage && tokenIdentifier) {
        usage = await ctx.db
          .query("messageUsage")
          .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", tokenIdentifier)
          )
          .first();
      }

      if (!usage) {
        // create new window starting now
        console.log(
          "[limits] creating new usage window for user",
          String(userConvexId)
        );
        await ctx.db.insert("messageUsage", {
          userId: userConvexId as any,
          tokenIdentifier,
          anonKey: undefined,
          count: 1,
          windowStart: now,
          lastUpdated: now,
        });
        return { allowed: true, remaining: USER_LIMIT - 1 };
      }

      if (now - usage.windowStart >= WINDOW_MS) {
        // reset window
        console.log(
          "[limits] resetting usage window for user",
          String(userConvexId)
        );
        await ctx.db.patch(usage._id, {
          count: 1,
          windowStart: now,
          lastUpdated: now,
        });
        return { allowed: true, remaining: USER_LIMIT - 1 };
      }

      if (usage.count >= USER_LIMIT) {
        throw new Error(
          `Message limit reached. You can send up to ${USER_LIMIT} messages every 5 hours.`
        );
      }

      await ctx.db.patch(usage._id, {
        count: usage.count + 1,
        lastUpdated: now,
      });
      console.log(
        "[limits] incremented usage for user",
        String(userConvexId),
        "to",
        usage.count + 1
      );
      return { allowed: true, remaining: USER_LIMIT - (usage.count + 1) };
    }

    // Guest flow
    if (!anonKey) {
      throw new Error(
        "Anonymous usage requires an anonKey. Please provide anonKey from the client."
      );
    }

    let usage = await ctx.db
      .query("messageUsage")
      .withIndex("by_anon", (q) => q.eq("anonKey", anonKey))
      .first();

    if (!usage) {
      await ctx.db.insert("messageUsage", {
        userId: undefined,
        tokenIdentifier: undefined,
        anonKey,
        count: 1,
        windowStart: now,
        lastUpdated: now,
      });
      return { allowed: true, remaining: GUEST_LIMIT - 1 };
    }

    if (now - usage.windowStart >= WINDOW_MS) {
      await ctx.db.patch(usage._id, {
        count: 1,
        windowStart: now,
        lastUpdated: now,
      });
      return { allowed: true, remaining: GUEST_LIMIT - 1 };
    }

    if (usage.count >= GUEST_LIMIT) {
      throw new Error(
        `Guest message limit reached. You can send up to ${GUEST_LIMIT} messages every 5 hours.`
      );
    }

    await ctx.db.patch(usage._id, {
      count: usage.count + 1,
      lastUpdated: now,
    });
    return { allowed: true, remaining: GUEST_LIMIT - (usage.count + 1) };
  },
});
