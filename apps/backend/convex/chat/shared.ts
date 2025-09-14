import { streamText, tool, type CoreMessage, stepCountIs } from "ai";
import { z } from "zod";
import { tavily } from "../../../web/src/components/tavily/core";

// Vercel AI SDK Providers
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Your project's internal imports
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { models } from "../../../web/src/lib/models";
import { getPrompt } from "../../../web/src/components/prompts/base";
import { generateImage } from "./node";

// --- Types ---

interface ToolConfig {
  webSearch?: boolean;
  imageGeneration?: boolean;
  research?: boolean;
}

interface UserContext {
  userId: Id<"users">;
  email?: string;
  settings: any;
}

interface ModelConfig {
  model: any;
  provider: string;
}

// --- Tavily Client Setup ---

const tavilyClient = tavily(process.env.TAVILY_API_KEY || "");

// --- Advanced Web Search Tool ---

export const advancedWebSearchTool = tool({
      description:
    "Search the web for up-to-date information with advanced filtering options",
      inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .max(150)
      .describe("The search query to find relevant, recent information"),
    maxResults: z
          .number()
      .min(1)
      .max(20)
          .optional()
      .describe("Maximum number of results to return (default: 7)"),
    searchDepth: z
      .enum(["basic", "advanced"])
          .optional()
      .describe("Search depth level (default: advanced)"),
    timeRange: z
      .enum(["week", "month", "year", "all"])
          .optional()
      .describe("Time range for search results (default: week)"),
      }),
      execute: async ({
    query,
    maxResults = 7,
    searchDepth = "advanced",
    timeRange = "week",
      }) => {
    console.log(
      `🔍 Advanced Tavily search: "${query}" (${searchDepth}, ${timeRange})`
    );

    try {
      const response = await tavilyClient.search(query, {
        maxResults: maxResults,
        searchDepth: searchDepth,
        // Note: timeRange is not directly supported in the custom Tavily client
        // You may need to implement this feature or use a different approach
      });

      console.log(
        `✅ Tavily search successful: ${response.results.length} results`
      );

      return response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score,
        publishedDate: result.published_date,
      }));
        } catch (error) {
      console.error("❌ Tavily search failed:", error);
          return {
        error: "Failed to perform web search",
        message: (error as Error).message,
        query,
          };
        }
      },
    });

// --- Image Generation Tool ---

export const imageGenerationTool = tool({
      description:
    "Generate high-quality images based on detailed text descriptions",
      inputSchema: z.object({
    prompt: z
          .string()
      .min(10)
      .max(500)
      .describe("Detailed description of the image to generate"),
    style: z
      .enum(["realistic", "artistic", "cartoon", "abstract"])
          .optional()
      .describe("Visual style for the generated image"),
    quality: z
      .enum(["standard", "high"])
          .optional()
      .describe("Image quality setting"),
  }),
  execute: async ({ prompt, style = "realistic", quality = "high" }) => {
    console.log(`🎨 Generating image: "${prompt}" (${style}, ${quality})`);

    try {
      // This would integrate with your existing generateImage function
      const imageUrl = await generateImage(
        null, // ctx will be passed from the main function
        `${prompt} in ${style} style`,
        process.env.GEMINI_API_KEY || ""
      );

      return {
        success: true,
        imageUrl,
        prompt,
        style,
        quality,
      };
        } catch (error) {
      console.error("❌ Image generation failed:", error);
          return {
        error: "Failed to generate image",
        message: (error as Error).message,
        prompt,
          };
        }
      },
    });

// --- Tool Registry ---

const createToolRegistry = (config: ToolConfig, ctx: any) => {
  const tools: Record<string, any> = {};
  const activeToolNames: string[] = [];

  if (config.webSearch) {
    tools.webSearch = advancedWebSearchTool;
    activeToolNames.push("webSearch");
  }

  if (config.imageGeneration) {
    tools.generateImage = imageGenerationTool;
    activeToolNames.push("generateImage");
  }

  // Add more tools here as needed
  // if (config.research) {
  //   tools.research = researchTool;
  //   activeToolNames.push("research");
  // }

  return { tools, activeToolNames };
};

// --- Model Management ---

const getModelConfig = (modelId: string): ModelConfig => {
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    console.warn(`Model not found: ${modelId}, falling back to Gemini Flash`);
    const fallbackModel = models.find(
      (m) => m.id === "gemini-1.5-flash-latest"
    );
    return {
      model: fallbackModel || models[0],
      provider: fallbackModel?.provider || "gemini",
    };
  }

  return { model, provider: model.provider };
};

const getActiveApiKey = async (ctx: any, service: string): Promise<string> => {
  // Try user's API key first
  const userKey = await ctx.runQuery(api.api_keys.getUserDefaultApiKey, {
    service,
  });

  if (userKey) {
    console.log(`Using user's ${service} API key`);
    return userKey;
  }

  // Fall back to environment variables
  const envVarMap: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    moonshot: process.env.MOONSHOT_KEY,
  };

  const envKey = envVarMap[service];
  if (envKey) {
    console.log(`Using environment ${service} API key`);
    return envKey;
  }

  throw new Error(
    `No API key found for ${service}. Please add one in your settings or environment variables.`
  );
};

const initializeModel = async (ctx: any, provider: string, modelId: string) => {
  const apiKey = await getActiveApiKey(ctx, provider);

  switch (provider) {
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "groq":
      return createGroq({ apiKey })(modelId);
    case "openrouter":
      return createOpenRouter({ apiKey })(modelId);
    case "moonshot":
      return createOpenAICompatible({
        name: "moonshot",
        apiKey,
        baseURL: "https://api.moonshot.ai/v1",
      })(modelId);
    default:
      console.warn(`Unknown provider: ${provider}. Falling back to Gemini`);
      const geminiKey = await getActiveApiKey(ctx, "gemini");
      return createGoogleGenerativeAI({ apiKey: geminiKey })(
        "gemini-1.5-flash-latest"
      );
  }
};

// --- User Management ---

export async function findUser(
  ctx: any,
  { tokenIdentifier, email }: { tokenIdentifier: string; email?: string }
) {
  let user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
    .first();

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();
  }

  return user;
}

export async function getOrCreateUserId(
  ctx: any,
  tokenIdentifier: string,
  email?: string
): Promise<Id<"users">> {
  if (!tokenIdentifier) {
    throw new Error("Token identifier is required");
  }

  // Try to find user by token first, then by email
  let existingUser = await ctx.runQuery(api.users.getUserByToken, {
    tokenIdentifier,
  });

  if (!existingUser && email) {
    existingUser = await ctx.runQuery(api.users.getUserByEmail, {
      email,
    });
  }

  if (existingUser) {
    if (email && !existingUser.tokenIdentifier) {
      await ctx.runMutation(api.users.updateUserToken, {
        userId: existingUser._id,
        tokenIdentifier,
      });
    }
    return existingUser._id;
  }

  return ctx.runMutation(api.users.createUser, {
    name: email?.split("@")[0] || "New User",
    email,
    tokenIdentifier,
  });
}

// --- Core AI Response Generation ---

export const generateAIResponse = async (
  ctx: any,
  chatMessages: CoreMessage[],
  modelId: string,
  assistantMessageId: Id<"messages">,
  toolConfig: ToolConfig = {
    webSearch: false,
    imageGeneration: false,
    research: false,
  },
  isNode = false
) => {
  try {
    if (!ctx?.auth) {
      throw new Error("Invalid context provided");
    }

    // Add system message if this is the first turn
    if (chatMessages.length === 1) {
      chatMessages.unshift({
        role: "system",
        content: "You are a helpful AI assistant with access to various tools.",
      });
    }

    const { model, provider } = getModelConfig(modelId);
    if (!model) {
      throw new Error(`Invalid model selected: ${modelId}`);
    }

    const aiModel = await initializeModel(ctx, provider, model.id);

    // Get user context
    const identity = await ctx.auth.getUserIdentity();
    const userId = await getOrCreateUserId(
      ctx,
      identity?.tokenIdentifier ?? "",
      identity?.email
    );

    const userSettings = await ctx.runQuery(api.users.getMySettings, {
      userId,
    });

    const userContext: UserContext = {
      userId,
      email: userSettings.email,
      settings: userSettings,
    };

    // Setup tools
    const { tools, activeToolNames } = createToolRegistry(toolConfig, ctx);

    console.log(
      `🤖 Model: ${
        model.id
      }, Provider: ${provider}, Active Tools: [${activeToolNames.join(", ")}]`
    );

    // Get personalized system prompt
    const systemPrompt = getPrompt({
      ctx,
      user: {
        _id: userId,
        _creationTime: 0,
        email: userContext.email || "",
      },
      activeTools: activeToolNames as ("research" | "search" | "image")[],
    });

    // Generate AI response with real-time streaming
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: chatMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(10), // Stop after 10 steps
    });

    // Process the stream in real-time
    let accumulatedContent = "";
    let accumulatedToolCalls: any[] = [];

    try {
      for await (const delta of result.textStream) {
        accumulatedContent += delta;

        // Update message with current content
          await ctx.runMutation(api.chat.mutations.updateMessage, {
            messageId: assistantMessageId,
            content: accumulatedContent,
            isComplete: false,
          });
      }

      // Process tool calls and results from the full stream
      for await (const delta of result.fullStream) {
        if (delta.type === "tool-call") {
          const mappedToolCall = {
            toolCallId:
              delta.toolCallId || `call_${Date.now()}_${Math.random()}`,
            toolName: delta.toolName,
            args: delta.input || {},
            result: undefined,
          };

          accumulatedToolCalls.push(mappedToolCall);

          // Update message with tool calls
            await ctx.runMutation(api.chat.mutations.updateMessage, {
              messageId: assistantMessageId,
              content: accumulatedContent,
              toolCalls: accumulatedToolCalls,
            isComplete: false,
          });
        } else if (delta.type === "tool-result") {
          const toolCall = accumulatedToolCalls.find(
            (tc) => tc.toolCallId === delta.toolCallId
          );
          if (toolCall) {
            toolCall.result = delta.output;
          }

          // Update message with tool results
            await ctx.runMutation(api.chat.mutations.updateMessage, {
              messageId: assistantMessageId,
            content: accumulatedContent,
              toolCalls: accumulatedToolCalls,
            isComplete: false,
          });
        }
      }

      // Final update with completion
          await ctx.runMutation(api.chat.mutations.updateMessage, {
            messageId: assistantMessageId,
            content: accumulatedContent,
            toolCalls: accumulatedToolCalls,
            isComplete: true,
          });

      console.log(`✅ AI response generated successfully`);

      return {
        success: true,
        content: accumulatedContent,
        toolCalls: accumulatedToolCalls,
        toolResults: [], // Tool results are embedded in toolCalls
        usage: undefined, // Usage info not available in streamText
      };
    } catch (streamError) {
      console.error("❌ Stream processing error:", streamError);

      // Update message with error
        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          content:
          accumulatedContent +
          "\n\n*An error occurred while generating the response.*",
          isComplete: true,
        });

      throw streamError;
    }
  } catch (error) {
    console.error("❌ Error in generateAIResponse:", error);

    // Update message with error
      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
      content:
        "I apologize, but I encountered an error while generating a response. Please try again.",
        isComplete: true,
    });

    throw error;
  }
};

// --- Legacy compatibility function ---

export const webSearchTool = advancedWebSearchTool;
