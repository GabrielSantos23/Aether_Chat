import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  generateText,
  generateObject,
  tool,
  stepCountIs,
  NoSuchToolError,
} from "ai";
import { z } from "zod";

interface ResearchAction {
  type: "search" | "read";
  toolCallId: string;
  thoughts: string;
  query?: string;
  url?: string;
  timestamp: number;
}

interface ResearchSession {
  _id: Id<"research_sessions">;
  userId: string;
  prompt: string;
  thoughts: string;
  status: "running" | "completed" | "failed";
  summary?: string;
  actions: ResearchAction[];
  createdAt: number;
  completedAt?: number;
}

export const researchInputSchema = v.object({
  thoughts: v.string(),
  prompt: v.string(),
});

export const researchActionSchema = v.object({
  type: v.union(v.literal("search"), v.literal("read")),
  toolCallId: v.string(),
  thoughts: v.string(),
  query: v.optional(v.string()),
  url: v.optional(v.string()),
  timestamp: v.number(),
});

export const researchSessionSchema = v.object({
  userId: v.string(),
  prompt: v.string(),
  thoughts: v.string(),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed")
  ),
  summary: v.optional(v.string()),
  actions: v.array(researchActionSchema),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const createResearchSession = mutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    thoughts: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("research_sessions", {
      userId: args.userId,
      prompt: args.prompt,
      thoughts: args.thoughts,
      status: "running",
      actions: [],
      createdAt: Date.now(),
    });

    return sessionId;
  },
});

export const updateResearchSession = mutation({
  args: {
    sessionId: v.id("research_sessions"),
    summary: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("running"), v.literal("completed"), v.literal("failed"))
    ),
    actions: v.optional(v.array(researchActionSchema)),
  },
  handler: async (ctx, args) => {
    const updates: any = {};

    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "completed" || args.status === "failed") {
        updates.completedAt = Date.now();
      }
    }
    if (args.actions !== undefined) updates.actions = args.actions;

    await ctx.db.patch(args.sessionId, updates);
  },
});

export const addResearchAction = mutation({
  args: {
    sessionId: v.id("research_sessions"),
    action: researchActionSchema,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const updatedActions = [...session.actions, args.action];
    await ctx.db.patch(args.sessionId, { actions: updatedActions });
  },
});

export const getResearchSession = query({
  args: { sessionId: v.id("research_sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getUserResearchSessions = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("research_sessions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const incrementUsage = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_usage")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      const currentUsage = existing[args.type as keyof typeof existing] || 0;
      await ctx.db.patch(existing._id, {
        [args.type]: (currentUsage as number) + args.amount,
      });
    } else {
      await ctx.db.insert("user_usage", {
        userId: args.userId,
        [args.type]: args.amount,
      });
    }
  },
});

export const decrementUsage = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_usage")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      const currentUsage = existing[args.type as keyof typeof existing] || 0;
      await ctx.db.patch(existing._id, {
        [args.type]: Math.max(0, (currentUsage as number) - args.amount),
      });
    }
  },
});

export const getUserUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_usage")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

export const performResearch = action({
  args: {
    userId: v.string(),
    thoughts: v.string(),
    prompt: v.string(),
    limits: v.object({
      RESEARCH: v.number(),
    }),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    sessionId: Id<"research_sessions">;
    summary: string;
    actions: ResearchAction[];
  }> => {
    const usage = await ctx.runQuery(api.ai.research.getUserUsage, {
      userId: args.userId,
    });

    const currentUsage = usage?.research || 0;
    if (currentUsage >= args.limits.RESEARCH) {
      throw new Error("Research limit reached");
    }

    const sessionId: Id<"research_sessions"> = await ctx.runMutation(
      api.ai.research.createResearchSession,
      {
        userId: args.userId,
        prompt: args.prompt,
        thoughts: args.thoughts,
      }
    );

    try {
      await ctx.runMutation(api.ai.research.incrementUsage, {
        userId: args.userId,
        type: "research",
        amount: 1,
      });

      const toolCallId = `research_${sessionId}_${Date.now()}`;
      const actions: ResearchAction[] = [];

      const { text: summary } = await generateText({
        model: "openai/gpt-4o", // Using a more accessible model
        prompt: getResearchPrompt(args.prompt),
        stopWhen: stepCountIs(50),
        tools: {
          search: tool({
            description: "Search the web for information",
            inputSchema: z.object({
              thoughts: z
                .string()
                .describe(
                  "Your thoughts on what you are currently doing in 20-50 words."
                ),
              query: z.string(),
            }),
            execute: async ({ query, thoughts }) => {
              const action: ResearchAction = {
                type: "search",
                toolCallId,
                thoughts,
                query,
                timestamp: Date.now(),
              };

              actions.push(action);

              await ctx.runMutation(api.ai.research.addResearchAction, {
                sessionId,
                action,
              });

              return await simulateSearch(query);
            },
          }),
          read_site: tool({
            description: "Read the contents of a URL",
            inputSchema: z.object({
              thoughts: z
                .string()
                .describe(
                  "Your thoughts on what you are currently doing in 20-50 words."
                ),
              url: z.string(),
            }),
            execute: async ({ url, thoughts }) => {
              const action: ResearchAction = {
                type: "read",
                toolCallId,
                thoughts,
                url,
                timestamp: Date.now(),
              };

              actions.push(action);

              await ctx.runMutation(api.ai.research.addResearchAction, {
                sessionId,
                action,
              });

              return await simulateReadSite(url);
            },
          }),
        },
        experimental_repairToolCall: async ({
          error,
          toolCall,
          tools,
          inputSchema,
        }) => {
          if (NoSuchToolError.isInstance(error)) {
            return null;
          }

          const tool = tools[toolCall.toolName as keyof typeof tools];

          const { object: input } = await generateObject({
            model: "openai/gpt-4o-mini",
            schema: tool.inputSchema,
            prompt: [
              `The model tried to call the tool "${toolCall.toolName}" with the following arguments:`,
              JSON.stringify(toolCall.input),
              `The tool accepts the following schema:`,
              JSON.stringify(inputSchema(toolCall)),
              "Please fix the arguments.",
              `Today's date is ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`,
            ].join("\n"),
          });

          return {
            ...toolCall,
            input: input as any,
          };
        },
      });

      await ctx.runMutation(api.ai.research.updateResearchSession, {
        sessionId,
        summary,
        status: "completed",
        actions,
      });

      return {
        sessionId,
        summary,
        actions,
      };
    } catch (error) {
      console.error("Research error:", error);

      await ctx.runMutation(api.ai.research.updateResearchSession, {
        sessionId,
        status: "failed",
      });

      await ctx.runMutation(api.ai.research.decrementUsage, {
        userId: args.userId,
        type: "research",
        amount: 1,
      });

      throw error;
    }
  },
});

async function simulateSearch(query: string) {
  return {
    results: [
      {
        title: `Search result for: ${query}`,
        url: "https://example.com",
        snippet: "This is a simulated search result snippet.",
      },
    ],
  };
}

async function simulateReadSite(url: string) {
  return {
    content: `This is simulated content from ${url}. In a real implementation, this would contain the actual webpage content.`,
    title: "Example Page Title",
  };
}

function getResearchPrompt(userPrompt: string): string {
  return `You are a research assistant tasked with thoroughly researching the following topic:

${userPrompt}

Please conduct comprehensive research by:
1. Searching for relevant information using multiple search queries
2. Reading important sources and documents
3. Gathering diverse perspectives and data points
4. Synthesizing the information into a comprehensive summary

Use the available tools to search and read sources. Provide your thoughts on each action you take.

Begin your research now.`;
}

/*
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  research_sessions: defineTable({
    userId: v.string(),
    prompt: v.string(),
    thoughts: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    summary: v.optional(v.string()),
    actions: v.array(v.object({
      type: v.union(v.literal("search"), v.literal("read")),
      toolCallId: v.string(),
      thoughts: v.string(),
      query: v.optional(v.string()),
      url: v.optional(v.string()),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  user_usage: defineTable({
    userId: v.string(),
  }).index("by_user", ["userId"]),
});
*/
