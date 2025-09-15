import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const saveResearchReport = mutation({
  args: {
    prompt: v.string(),
    pdfKey: v.string(),
    pdfUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to save research reports.");
    }

    const userId = identity.subject as Id<"users">;

    await ctx.db.insert("researchReports", {
      userId,
      prompt: args.prompt,
      pdfKey: args.pdfKey,
      pdfUrl: args.pdfUrl,
      createdAt: Date.now(),
    });
  },
});

export const getUserResearchReports = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject as Id<"users">;
    const reports = await ctx.db
      .query("researchReports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return reports;
  },
});
