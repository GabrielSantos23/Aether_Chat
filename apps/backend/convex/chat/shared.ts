import {
  streamText,
  tool,
  type CoreMessage,
  stepCountIs,
  experimental_generateImage as generateImage,
  smoothStream,
} from "ai";
import { z } from "zod";
import { tavily } from "../../../web/src/components/tavily/core";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { openai } from "@ai-sdk/openai";

import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { models } from "../../../web/src/lib/models";
import { getPrompt } from "./prompt";

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

const tavilyClient = tavily(process.env.TAVILY_API_KEY || "");

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
    try {
      const response = await tavilyClient.search(query, {
        maxResults: maxResults,
        searchDepth: searchDepth,
      });

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

export const imageGenerationTool = tool({
  description:
    "Generate high-quality images based on detailed text descriptions using AI models",
  inputSchema: z.object({
    prompt: z
      .string()
      .min(10)
      .max(500)
      .describe("Detailed description of the image to generate"),
    style: z
      .enum(["realistic", "artistic", "cartoon", "abstract"])
      .optional()
      .describe("Visual style for the generated image (default: realistic)"),
    quality: z
      .enum(["standard", "hd"])
      .optional()
      .describe("Image quality setting (default: hd)"),
    size: z
      .enum(["1024x1024", "1792x1024", "1024x1792"])
      .optional()
      .describe("Image size (default: 1024x1024)"),
    n: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .describe("Number of images to generate (default: 1)"),
  }),
  execute: async ({
    prompt,
    style = "realistic",
    quality = "hd",
    size = "1024x1024",
    n = 1,
  }) => {
    try {
      const enhancedPrompt =
        style !== "realistic" ? `${prompt} in ${style} style` : prompt;

      const result: any = await generateImage({
        model: openai.image("dall-e-3"), // Use OpenAI DALL-E 3 as default
        prompt: enhancedPrompt,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        n: n,
        providerOptions: {
          openai: {
            quality: quality,
            style: style === "realistic" ? "natural" : "vivid",
          },
        },
      });

      if ("image" in result) {
        return {
          success: true,
          images: [
            {
              base64: result.image.base64,
              url: `data:image/png;base64,${result.image.base64}`,
            },
          ],
          prompt: enhancedPrompt,
          style,
          quality,
          size,
          count: 1,
        };
      } else if ("images" in result) {
        return {
          success: true,
          images: result.images.map((img: any) => ({
            base64: img.base64,
            url: `data:image/png;base64,${img.base64}`,
          })),
          prompt: enhancedPrompt,
          style,
          quality,
          size,
          count: result.images.length,
        };
      }

      throw new Error("No images generated");
    } catch (error) {
      console.error("❌ Image generation failed:", error);
      return {
        success: false,
        error: "Failed to generate image",
        message: (error as Error).message,
        prompt,
      };
    }
  },
});

export const imagenGenerationTool = tool({
  description:
    "Generate images using Google's Imagen model with aspect ratio control",
  inputSchema: z.object({
    prompt: z
      .string()
      .min(10)
      .max(500)
      .describe("Detailed description of the image to generate"),
    aspectRatio: z
      .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
      .optional()
      .describe("Aspect ratio of the image (default: 1:1)"),
    n: z
      .number()
      .min(1)
      .max(4)
      .optional()
      .describe("Number of images to generate (default: 1)"),
  }),
  execute: async ({ prompt, aspectRatio = "1:1", n = 1 }) => {
    try {
      const result: any = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: prompt,
        n: n,
      });

      if ("image" in result) {
        return {
          success: true,
          images: [
            {
              base64: result.image.base64,
              url: `data:image/png;base64,${result.image.base64}`,
            },
          ],
          prompt,
          aspectRatio,
          count: 1,
        };
      } else if ("images" in result) {
        return {
          success: true,
          images: result.images.map((img: any) => ({
            base64: img.base64,
            url: `data:image/png;base64,${img.base64}`,
          })),
          prompt,
          aspectRatio,
          count: result.images.length,
        };
      }

      throw new Error("No images generated");
    } catch (error) {
      console.error("❌ Imagen generation failed:", error);
      return {
        success: false,
        error: "Failed to generate image with Imagen",
        message: (error as Error).message,
        prompt,
      };
    }
  },
});

const createToolRegistry = (config: ToolConfig, ctx: any) => {
  const tools: Record<string, any> = {};
  const activeToolNames: string[] = [];

  if (config.webSearch) {
    tools.webSearch = advancedWebSearchTool;
    activeToolNames.push("search");
  }

  if (config.imageGeneration) {
    tools.generateImage = imageGenerationTool;
    activeToolNames.push("image");
  }

  if (config.research) {
    activeToolNames.push("research");
  }

  return { tools, activeToolNames };
};

const getModelConfig = (modelId: string): ModelConfig => {
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    console.warn(`Model not found: ${modelId}, falling back to Gemini Flash`);
    const preferredFallbackIds = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "google/gemini-flash-1.5",
    ];
    let fallbackModel = models.find((m) => preferredFallbackIds.includes(m.id));
    if (!fallbackModel) {
      fallbackModel = models.find((m) => m.provider === "gemini");
    }
    if (fallbackModel) {
      return {
        model: fallbackModel,
        provider: fallbackModel.provider,
      };
    }
    return {
      model: models[0],
      provider: models[0]?.provider || "gemini",
    };
  }

  return { model, provider: model.provider };
};

const getActiveApiKey = async (ctx: any, service: string): Promise<string> => {
  const userKey = await ctx.runQuery(api.api_keys.getUserDefaultApiKey, {
    service,
  });

  if (userKey) {
    return userKey;
  }

  const envVarMap: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    moonshot: process.env.MOONSHOT_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  const envKey = envVarMap[service];
  if (envKey) {
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
    case "openai":
      return createOpenAICompatible({
        name: "openai",
        apiKey,
        baseURL: "https://api.openai.com/v1",
      })(modelId);
    default:
      console.warn(`Unknown provider: ${provider}. Falling back to Gemini`);
      const geminiKey = await getActiveApiKey(ctx, "gemini");
      return createGoogleGenerativeAI({ apiKey: geminiKey })(
        "gemini-1.5-flash-latest"
      );
  }
};

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
): Promise<Id<"users"> | null> {
  if (!tokenIdentifier) {
    throw new Error("Token identifier is required");
  }

  const isActionContext =
    typeof ctx.runQuery === "function" && typeof ctx.runMutation === "function";

  if (isActionContext) {
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
      image: "",
      tokenIdentifier,
    });
  } else {
    const isMutationContext = typeof ctx.db.insert === "function";

    let existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) =>
        q.eq("tokenIdentifier", tokenIdentifier)
      )
      .first();

    if (!existingUser && email) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .first();
    }

    if (existingUser) {
      if (email && !existingUser.tokenIdentifier && isMutationContext) {
        await ctx.db.patch(existingUser._id, { tokenIdentifier });
      }
      return existingUser._id;
    }

    if (!isMutationContext) {
      return null;
    }

    return ctx.db.insert("users", {
      name: email?.split("@")[0] || "New User",
      email,
      image: "",
      tokenIdentifier,
    });
  }
}

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

    if (chatMessages.length === 1) {
      chatMessages.unshift({
        role: "system",
        content:
          "You are a helpful AI assistant with access to various tools including web search and image generation.",
      });
    }

    const { model, provider } = getModelConfig(modelId);
    if (!model) {
      throw new Error(`Invalid model selected: ${modelId}`);
    }

    const aiModel = await initializeModel(ctx, provider, model.id);

    const identity = await ctx.auth.getUserIdentity();
    const userId = await getOrCreateUserId(
      ctx,
      identity?.tokenIdentifier ?? "",
      identity?.email
    );

    if (!userId) {
      throw new Error("User not found or could not be created");
    }

    const nonNullUserId: Id<"users"> = userId;

    const userSettings = await ctx.runQuery(api.users.getMySettings, {
      userId: nonNullUserId,
    });

    const userContext: UserContext = {
      userId: nonNullUserId,
      email: userSettings?.email || "",
      settings: userSettings || {},
    };

    const { tools, activeToolNames } = createToolRegistry(toolConfig, ctx);

    const systemPrompt = getPrompt({
      ctx,
      user: {
        _id: nonNullUserId,
        _creationTime: 0,
        email: userContext.email || "",
      },
      activeTools: activeToolNames as ("research" | "search" | "image")[],
    });

    const supportsReasoning = checkModelSupportsReasoning(modelId, provider);

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: chatMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(10),
      experimental_transform: smoothStream({
        delayInMs: 10,
        chunking: "word",
      }),
    });

    let accumulatedContent = "";
    let accumulatedToolCalls: any[] = [];
    let accumulatedThinking = "";
    const thinkingStart = Date.now();

    let updateQueue: any = {};
    let updateTimeout: NodeJS.Timeout | null = null;
    let isUpdating = false;
    const UPDATE_DELAY = 16;

    const scheduleUpdate = async (updateData: any) => {
      updateQueue = { ...updateQueue, ...updateData };

      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      const performUpdate = async () => {
        if (isUpdating) {
          updateTimeout = setTimeout(performUpdate, UPDATE_DELAY);
          return;
        }

        isUpdating = true;
        try {
          if (Object.keys(updateQueue).length > 0) {
            await ctx.runMutation(api.chat.mutations.updateMessage, {
              messageId: assistantMessageId,
              ...updateQueue,
              isComplete: false,
            });
            updateQueue = {};
          }
          updateQueue = {};
        } catch (error) {
          console.error("Error updating message:", error);
        } finally {
          isUpdating = false;
        }
      };

      updateTimeout = setTimeout(performUpdate, UPDATE_DELAY);
    };

    try {
      const textStreamPromise = (async () => {
        for await (const delta of result.textStream) {
          accumulatedContent += delta;
          if (accumulatedContent.length % 10 === 0 || delta.includes(" ")) {
            await scheduleUpdate({ content: accumulatedContent });
          }
        }
        await scheduleUpdate({ content: accumulatedContent });
      })();

      const fullStreamPromise = (async () => {
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
            await scheduleUpdate({ toolCalls: accumulatedToolCalls });
          } else if (delta.type === "tool-result") {
            const toolCall = accumulatedToolCalls.find(
              (tc) => tc.toolCallId === delta.toolCallId
            );
            if (toolCall) {
              toolCall.result = delta.output;
              await scheduleUpdate({ toolCalls: accumulatedToolCalls });
            }
          } else if (delta.type === "reasoning-delta" && supportsReasoning) {
            const reasoningText =
              typeof delta.text === "string" ? delta.text : "";
            if (reasoningText) {
              accumulatedThinking += reasoningText;
              if (accumulatedThinking.length % 50 === 0) {
                await scheduleUpdate({ thinking: accumulatedThinking });
              }
            }
          }
        }
      })();

      await Promise.all([textStreamPromise, fullStreamPromise]);

      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }

      while (isUpdating) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
        content: accumulatedContent,
        toolCalls: accumulatedToolCalls,
        thinking: accumulatedThinking || undefined,
        thinkingDuration: Math.max(
          0,
          Math.ceil((Date.now() - thinkingStart) / 1000)
        ),
        isComplete: true,
      });

      return {
        success: true,
        content: accumulatedContent,
        toolCalls: accumulatedToolCalls,
        toolResults: [],
        usage: undefined,
      };
    } catch (streamError) {
      console.error("❌ Stream processing error:", streamError);

      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }

      while (isUpdating) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
        content:
          accumulatedContent +
          "\n\n*An error occurred while generating the response.*",
        thinking: accumulatedThinking || undefined,
        thinkingDuration: Math.max(
          0,
          Math.ceil((Date.now() - thinkingStart) / 1000)
        ),
        isComplete: true,
      });

      throw streamError;
    }
  } catch (error) {
    console.error("❌ Error in generateAIResponse:", error);

    await ctx.runMutation(api.chat.mutations.updateMessage, {
      messageId: assistantMessageId,
      content:
        "I apologize, but I encountered an error while generating a response. Please try again.",
      isComplete: true,
    });

    throw error;
  }
};

function checkModelSupportsReasoning(
  modelId: string,
  provider: string
): boolean {
  const reasoningModels = [
    "o1-preview",
    "o1-mini",
    "o1-pro",
    "deepseek-reasoner",
    "gemini-2.0-flash-thinking-exp",
    "claude-3-5-sonnet-20241022",
    "google/gemini-2.5-flash",
    "google/gemini-2.5-pro",
    "openai/gpt-5",
    "openai/gpt-5-mini",
    "deepseek/deepseek-r1-0528:free",
    "deepseek-ai/deepseek-r1-distill-llama-70b",
    "deepseek/deepseek-chat-v3-0324:free",
    "zhipuai/glm-4.5",
    "zhipuai/glm-4.5-air",
    "zhipuai/glm-4.5v",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/gpt-5-nano",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "x-ai/grok-3",
    "x-ai/grok-3-mini",
    "z-ai/glm-4.5-air:free",
  ];

  return (
    reasoningModels.some((model) => modelId.includes(model)) ||
    provider === "deepseek" ||
    (provider === "openai" && modelId.startsWith("o1")) ||
    (provider === "gemini" && modelId.includes("thinking"))
  );
}

export const webSearchTool = advancedWebSearchTool;
