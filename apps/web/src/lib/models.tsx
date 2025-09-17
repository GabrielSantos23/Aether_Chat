import { cn } from "./utils";
import {
  KimiIcon,
  QwenIcon,
  DeepSeekIcon,
  MetaIcon,
  ClaudeIcon,
  GrokIcon,
  GeminiIcon,
  GptIcon,
} from "../components/icons/logo-icons";

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  vendor:
    | "google"
    | "anthropic"
    | "openai"
    | "deepseek"
    | "meta"
    | "sarvam"
    | "qwen"
    | "moonshot";
  provider:
    | "gemini"
    | "openrouter"
    | "groq"
    | "google"
    | "anthropic"
    | "openai"
    | "deepseek"
    | "moonshot";
  category:
    | "google"
    | "anthropic"
    | "openai"
    | "deepseek"
    | "meta"
    | "sarvam"
    | "qwen"
    | "moonshot";
  features: ("vision" | "web" | "code" | "imagegen" | "weather")[];
  isPro?: boolean;
  isNew?: boolean;
  supportsThinking?: boolean;
  unauthenticated?: boolean;
  attachmentsSuppport: {
    pdf: boolean;
    image: boolean;
  };
  isApiKeyOnly?: boolean;
  toolCalls?: boolean;
  isFree?: boolean;
  /**
   * Flag indicating that this model is suitable for multi-step web research tasks.
   * When true it will appear in the Deep Research agent’s model selector.
   */
  canResearch?: boolean;
  /**
   * Logo component for this model.
   */
  logo?: React.ComponentType<{
    className?: string;
    size?: number;
    color?: string;
  }>;
}

export const models: ModelInfo[] = [
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    description:
      "Anthropic's most capable model with superior reasoning and analysis",
    vendor: "anthropic",
    provider: "openrouter",
    category: "anthropic",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    canResearch: true,
    logo: ClaudeIcon,
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description:
      "Anthropic's balanced model for everyday use with great performance",
    vendor: "anthropic",
    provider: "openrouter",
    category: "anthropic",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: true,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    canResearch: true,
    logo: ClaudeIcon,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Via OpenRouter",
    vendor: "anthropic",
    provider: "openrouter",
    category: "anthropic",
    features: ["vision", "code", "weather"],
    isPro: true,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isFree: false,
    isApiKeyOnly: true,
    canResearch: true,
    logo: ClaudeIcon,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude Haiku 3.5",
    description: "Anthropic's fastest and most cost-effective model",
    vendor: "anthropic",
    provider: "openrouter",
    category: "anthropic",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    canResearch: true,
    logo: ClaudeIcon,
  },
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "Deepseek R1 0528",
    description:
      "DeepSeek's reasoning model with step-by-step thinking capabilities",
    vendor: "deepseek",
    provider: "openrouter",
    category: "deepseek",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: DeepSeekIcon,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek Chat V3",
    description: "Via OpenRouter",
    vendor: "deepseek",
    provider: "openrouter",
    category: "deepseek",
    features: ["imagegen", "weather"],
    isPro: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    logo: DeepSeekIcon,
  },

  {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM 4.5 Air",
    description: "Via OpenRouter",
    vendor: "qwen",
    provider: "openrouter",
    category: "qwen",
    features: ["code", "weather"],
    isPro: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: true,
  },

  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    description: "Via OpenRouter",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["code", "weather"],
    isPro: false,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    logo: MetaIcon,
  },

  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    description:
      "Meta's large 70B parameter model with strong reasoning abilities",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: MetaIcon,
  },
  {
    id: "meta-llama/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision",
    description: "Meta's largest vision-capable model for image understanding",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: MetaIcon,
  },
  {
    id: "meta-llama/llama-3.2-11b-vision-instruct",
    name: "Llama 3.2 11B Vision",
    description:
      "Meta's mid-sized vision model balancing capability and efficiency",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: MetaIcon,
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    description: "Meta's compact model for lightweight applications",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: MetaIcon,
  },
  {
    id: "meta-llama/llama-3.2-1b-instruct",
    name: "Llama 3.2 1B",
    description: "Meta's smallest model for basic tasks and edge deployment",
    vendor: "meta",
    provider: "openrouter",
    category: "meta",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    logo: MetaIcon,
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Lightweight version for quick tasks",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["weather"],
    isPro: false,
    isNew: true,
    supportsThinking: false,
    unauthenticated: true,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    isFree: true,
    canResearch: true,
    logo: GeminiIcon,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Latest and fastest model",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "web", "code", "imagegen", "weather"],
    isPro: false,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: true,
    },
    toolCalls: true,
    canResearch: true,
    logo: GeminiIcon,
  },
  {
    id: "gemini-2.0-flash-thinking-exp-01-21",
    name: "Gemini 2.0 Flash Thinking",
    description: "Thinking capabilities",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "code", "imagegen", "weather"],
    isPro: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    logo: GeminiIcon,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Google's fastest premium model with comprehensive features",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "code", "web", "weather"],
    isPro: false,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: false,
    toolCalls: true,
    isFree: true,
    canResearch: true,
    logo: GeminiIcon,
  },
  {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite",
    description: "Google's lightweight and efficient model for fast responses",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "code", "web", "weather"],
    isPro: false,
    isNew: true,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: false,
    toolCalls: true,
    isFree: true,
    canResearch: true,
    logo: GeminiIcon,
  },
  {
    id: "gemini-2.5-pro-preview-05-06",
    name: "Gemini 2.5 Pro",
    description:
      "Google's most advanced model with superior reasoning and analysis",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "code", "web", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: true,
    isFree: false,
    canResearch: true,
    logo: GeminiIcon,
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    description: "Via OpenRouter",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "web", "code", "imagegen", "weather"],
    isPro: false,
    supportsThinking: false,
    unauthenticated: true,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isFree: true,
    toolCalls: true,
    logo: GeminiIcon,
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    description: "Via Groq",
    vendor: "meta",
    provider: "groq",
    category: "meta",
    features: ["code", "weather"],
    isPro: false,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    logo: MetaIcon,
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    name: "MoonshotAI: Kimi K2",
    description: "Via Groq",
    vendor: "moonshot",
    provider: "groq",
    category: "moonshot",
    features: ["web"],
    isPro: false,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    isFree: true,
    canResearch: true,
    isApiKeyOnly: false,
    toolCalls: true,
    logo: KimiIcon,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    description: "Via Groq",
    vendor: "deepseek",
    provider: "groq",
    category: "deepseek",
    features: ["code", "imagegen", "weather"],
    isPro: false,
    isFree: true,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    logo: DeepSeekIcon,
  },
  {
    id: "qwen/qwen3-32b",
    name: "Qwen 3.2B",
    description: "Via Groq",
    vendor: "qwen",
    provider: "groq",
    category: "qwen",
    features: ["code", "imagegen", "weather"],
    isPro: false,
    isFree: true,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    toolCalls: false,
    logo: QwenIcon,
  },

  // {
  //   id: "gemini-2.0-flash-preview-image-generation",
  //   name: "Gemini 2.0 Flash Image Generation",
  //   description: "Google's specialized model optimized for image generation",
  //   provider: "gemini",
  //   category: "google",
  //   features: ["vision", "code", "imagegen", "web"],
  //   isPro: false,
  //   isNew: false,
  //   supportsThinking: false,
  //   unauthenticated: false,
  //   attachmentsSuppport: {
  //     pdf: true,
  //     image: true,
  //   },
  //   isApiKeyOnly: false,
  //   toolCalls: false,
  //   isFree: true,
  // },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's most capable multimodal model",
    vendor: "openai",
    provider: "openai",
    category: "openai",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    canResearch: true,
    logo: GptIcon,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1-mini",
    description: "OpenAI's efficient model balancing performance and cost",
    vendor: "openai",
    provider: "openai",
    category: "openai",
    features: ["vision", "code", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: false,
    isFree: false,
    canResearch: true,
    logo: GptIcon,
  },
  {
    id: "kimi-k2-0711-preview",
    name: "Kimi v2",
    description: "Moonshot's advanced chat model, provided by MoonshotAI",
    vendor: "moonshot",
    provider: "moonshot",
    category: "moonshot",
    features: ["web"],
    isPro: true,
    isNew: true,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: true,
    isFree: false,
    canResearch: true,
    logo: KimiIcon,
  },
  {
    id: "moonshotai/kimi-k2:free",
    name: "Kimi K2 0711",
    description:
      "Kimi K2 is a model with a context length of 128k, featuring powerful code and Agent capabilities based on MoE architecture. It has 1T total parameters with 32B activated parameters. In benchmark performance tests across major categories including general knowledge reasoning, programming, mathematics, and Agent capabilities, the K2 model outperforms other mainstream open-source models.",
    vendor: "moonshot",
    provider: "openrouter",
    category: "moonshot",
    features: ["web"],
    isPro: false,
    isNew: false,
    supportsThinking: false,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: false,
      image: false,
    },
    isApiKeyOnly: true,
    toolCalls: true,
    isFree: true,
    canResearch: true,
    logo: KimiIcon,
  },
  {
    id: "gemini-1.5-pro-latest",
    name: "Gemini 1.5 Pro",
    description: "Google's most capable model with 1M context",
    vendor: "google",
    provider: "gemini",
    category: "google",
    features: ["vision", "web", "code", "imagegen", "weather"],
    isPro: true,
    isNew: false,
    supportsThinking: true,
    unauthenticated: false,
    attachmentsSuppport: {
      pdf: true,
      image: true,
    },
    isApiKeyOnly: true,
    toolCalls: true,
    isFree: false,
    logo: GeminiIcon,
  },
] as const;

export const getModelDisplayName = (modelId?: string) => {
  if (!modelId) return null;
  const model = models.find((m) => m.id === modelId);
  return model?.name || modelId;
};

export const getProviderColor = (modelId?: string) => {
  if (!modelId) return "bg-gray-500";

  const model = models.find((m) => m.id === modelId);

  if (!model) return "bg-gray-500";

  switch (model.provider) {
    case "gemini":
      return "bg-red-500";
    case "openrouter":
      return "bg-blue-500";
    case "groq":
      return "bg-yellow-500";
    case "moonshot":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export const getVendorColor = (vendor: string): string => {
  const getFullBgColor = (rest: string) => {
    return cn("bg-gradient-to-r", rest);
  };
  const model = models.find((m) => m.id === vendor);
  if (model) {
    return getVendorColor(model.provider);
  }
  switch (vendor) {
    case "google":
    case "gemini":
      return getFullBgColor("from-blue-500 to-purple-500");
    case "anthropic":
    case "claude":
      return getFullBgColor("from-purple-500 to-pink-500");
    case "openai":
    case "gpt":
      return getFullBgColor("from-green-500 to-teal-500");
    case "deepseek":
      return getFullBgColor("from-cyan-500 to-blue-500");
    case "meta":
    case "llama":
      return getFullBgColor("from-indigo-500 to-blue-500");
    case "o-series":
      return getFullBgColor("from-orange-500 to-red-500");
    case "sarvam":
      return getFullBgColor("from-yellow-500 to-orange-500");
    case "openrouter":
      return getFullBgColor("from-blue-500 to-green-500");
    case "qwen":
      return getFullBgColor("from-red-500 to-pink-500");
    case "moonshot":
      return getFullBgColor("from-purple-500 to-indigo-500");
    default:
      return getFullBgColor("from-gray-500 to-gray-600");
  }
};
