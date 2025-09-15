import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getModel(
  provider: string,
  modelId: string,
  apiKeyOverride?: string
): any {
  switch (provider) {
    case "openrouter": {
      const apiKey = apiKeyOverride || process.env.OPENROUTER_API_KEY || "";
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(modelId);
    }
    case "gemini": {
      const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY || "";
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "azure":
    default: {
      const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY || "";
      const openai = createOpenAICompatible({
        apiKey,
        baseURL: "https://api.openai.com/v1",
        name: provider,
      });
      return openai.chatModel ? openai.chatModel(modelId) : openai(modelId);
    }
  }
}
