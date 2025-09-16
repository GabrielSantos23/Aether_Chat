import { streamText, tool, type CoreMessage, stepCountIs } from "ai";
import { z } from "zod";
import { tavily } from "../../../web/src/components/tavily/core";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { models } from "../../../web/src/lib/models";
import { getPrompt } from "../../../web/src/components/prompts/base";
import { generateImage } from "./node";

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
    try {
      const imageUrl = await generateImage(
        null,
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

  return { tools, activeToolNames };
};

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
        content: "You are a helpful AI assistant with access to various tools.",
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

    // Check if model supports reasoning
    const supportsReasoning = checkModelSupportsReasoning(modelId, provider);

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: chatMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(10),
    });

    let accumulatedContent = "";
    let accumulatedToolCalls: any[] = [];
    let accumulatedThinking = "";
    const thinkingStart = Date.now();

    // Batch updates to reduce concurrency issues
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update every 100ms max
    let pendingUpdate: any = null;

    const scheduleUpdate = async (updateData: any) => {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_INTERVAL) {
        // Merge with pending update
        if (pendingUpdate) {
          pendingUpdate = { ...pendingUpdate, ...updateData };
        } else {
          pendingUpdate = updateData;
        }
        return;
      }

      // Execute pending update if exists
      if (pendingUpdate) {
        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          ...pendingUpdate,
          isComplete: false,
        });
        pendingUpdate = null;
      }

      // Execute current update
      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
        ...updateData,
        isComplete: false,
      });
      lastUpdateTime = now;
    };

    try {
      const processors: Promise<void>[] = [];

      // Process text stream
      processors.push(
        (async () => {
          for await (const delta of result.textStream) {
            accumulatedContent += delta;
            await scheduleUpdate({ content: accumulatedContent });
          }
        })()
      );

      // Process full stream for tool calls and reasoning
      processors.push(
        (async () => {
          for await (const delta of result.fullStream) {
            // Handle tool calls
            if (delta.type === "tool-call") {
              const mappedToolCall = {
                toolCallId:
                  delta.toolCallId || `call_${Date.now()}_${Math.random()}`,
                toolName: delta.toolName,
                args: delta.input || {},
                result: undefined,
              };

              accumulatedToolCalls.push(mappedToolCall);

              await scheduleUpdate({
                content: accumulatedContent,
                toolCalls: accumulatedToolCalls,
              });
            }
            // Handle tool results
            else if (delta.type === "tool-result") {
              const toolCall = accumulatedToolCalls.find(
                (tc) => tc.toolCallId === delta.toolCallId
              );
              if (toolCall) {
                toolCall.result = delta.output;
              }

              await scheduleUpdate({
                content: accumulatedContent,
                toolCalls: accumulatedToolCalls,
              });
            } else if (delta.type === "reasoning-delta" && supportsReasoning) {
              const reasoningText =
                typeof delta.text === "string" ? delta.text : "";

              if (reasoningText) {
                accumulatedThinking += reasoningText;

                await scheduleUpdate({
                  content: accumulatedContent,
                  thinking: accumulatedThinking,
                });
              }
            }
          }
        })()
      );

      if (supportsReasoning) {
        const finalResult = await result;

        if (finalResult.reasoning) {
          processors.push(
            (async () => {
              try {
                const reasoning = await finalResult.reasoning;
                if (typeof reasoning === "string" && reasoning) {
                  accumulatedThinking = reasoning;

                  await scheduleUpdate({
                    thinking: accumulatedThinking,
                  });
                }
              } catch (reasoningError) {
                console.warn("Could not access reasoning:", reasoningError);
              }
            })()
          );
        }

        try {
          const reasoningStream = (result as any).reasoningStream;
          if (
            reasoningStream &&
            typeof reasoningStream[Symbol.asyncIterator] === "function"
          ) {
            processors.push(
              (async () => {
                try {
                  for await (const reasoningChunk of reasoningStream) {
                    const text =
                      typeof reasoningChunk === "string"
                        ? reasoningChunk
                        : reasoningChunk?.text || reasoningChunk?.content || "";

                    if (text && typeof text === "string") {
                      accumulatedThinking += text;

                      await scheduleUpdate({
                        thinking: accumulatedThinking,
                      });
                    }
                  }
                } catch (streamError) {
                  console.warn("Reasoning stream error:", streamError);
                }
              })()
            );
          }
        } catch (reasoningStreamError) {
          console.warn(
            "Could not access reasoning stream:",
            reasoningStreamError
          );
        }
      }

      await Promise.all(processors);

      // Flush any pending updates
      if (pendingUpdate) {
        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          ...pendingUpdate,
          isComplete: false,
        });
      }

      // Final update with complete message
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
  ];

  return (
    reasoningModels.some((model) => modelId.includes(model)) ||
    provider === "deepseek" ||
    (provider === "openai" && modelId.startsWith("o1")) ||
    (provider === "gemini" && modelId.includes("thinking"))
  );
}

export const webSearchTool = advancedWebSearchTool;
