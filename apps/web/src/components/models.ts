export type AccessLevel = "public" | "account_required" | "premium_required";
export type Model = {
  id: string;
  name: string;
  model: string;
  description: string;
  capabilities: string[];
  icon: string;
  access: AccessLevel;
  credits?: number;
  pinned?: boolean;
};

export const models: Model[] = [
  {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    model: "anthropic/claude-4-sonnet",
    description:
      "Claude Sonnet 4 significantly improves on Sonnet 3.7's industry-leading capabilities, excelling in coding with a state-of-the-art 72.7% on SWE-bench. The model balances performance and efficiency for internal and external use cases, with enhanced steerability for greater control over implementations. While not matching Opus 4 in most domains, it delivers an optimal mix of capability and practicality.",
    capabilities: ["tools", "reasoning", "documents", "vision"],
    icon: "anthropic",
    access: "premium_required",
    credits: 5,
    pinned: true,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    model: "google/gemini-2.0-flash",
    description:
      "Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, built-in tool use, multimodal generation, and a 1M token context window.",
    capabilities: ["vision", "tools", "documents"],
    icon: "gemini",
    access: "public",
    pinned: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    model: "google/gemini-2.5-flash",
    description:
      "Gemini 2.5 Flash is a thinking model that offers great, well-rounded capabilities. It is designed to offer a balance between price and performance with multimodal support and a 1M token context window.",
    capabilities: ["vision", "tools", "reasoning", "documents"],
    icon: "gemini",
    access: "public",
    pinned: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    model: "google/gemini-2.5-pro",
    description:
      "Gemini 2.5 Pro is our most advanced reasoning Gemini model, capable of solving complex problems. It features a 2M token context window and supports multimodal inputs including text, images, audio, video, and PDF documents.",
    capabilities: ["vision", "tools", "reasoning", "documents"],
    icon: "gemini",
    access: "premium_required",
    pinned: true,
  },
  {
    id: "gpt-5",
    name: "GPT 5",
    model: "openai/gpt-5",
    description:
      "GPT-5 is OpenAI's flagship language model that excels at complex reasoning, broad real-world knowledge, code-intensive, and multi-step agentic tasks.",
    capabilities: ["tools", "reasoning", "vision"],
    icon: "openai",
    access: "premium_required",
    pinned: true,
  },
  {
    id: "gpt-5-mini",
    name: "GPT 5 Mini",
    model: "openai/gpt-5-mini",
    description:
      "GPT-5 mini is a cost optimized model that excels at reasoning/chat tasks. It offers an optimal balance between speed, cost, and capability.",
    capabilities: ["tools", "reasoning", "vision"],
    icon: "openai",
    access: "account_required",
    pinned: true,
  },
  {
    id: "moonshotai/kimi-k2:free",
    name: "Kimi K2 0711",
    model: "moonshotai/kimi-k2:free",
    description:
      "Kimi K2 is a model with a context length of 128k, featuring powerful code and Agent capabilities based on MoE architecture. It has 1T total parameters with 32B activated parameters. In benchmark performance tests across major categories including general knowledge reasoning, programming, mathematics, and Agent capabilities, the K2 model outperforms other mainstream open-source models.",
    capabilities: ["tools"],
    icon: "moonshot",
    access: "public",
    pinned: true,
  },

  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek: R1 0528 ",
    model: "deepseek/deepseek-r1-0528:free",
    description:
      "DeepSeek R1 is an advanced reasoning model that excels at complex problem-solving and mathematical reasoning tasks.",
    capabilities: ["reasoning"],
    icon: "deepseek",
    access: "public",
    pinned: false,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    model: "deepseek-ai/deepseek-r1-distill-llama-70b",
    description:
      "A distilled version of DeepSeek R1 based on Llama architecture, offering strong reasoning capabilities in a more efficient package.",
    capabilities: ["reasoning"],
    icon: "deepseek",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    model: "deepseek/deepseek-chat-v3-0324:free",
    description:
      "An improved version of DeepSeek V3 with enhanced capabilities and better performance across benchmarks.",
    capabilities: ["tools", "reasoning", "documents"],
    icon: "deepseek",
    access: "public",
    pinned: false,
  },
  {
    id: "glm-4.5",
    name: "GLM 4.5",
    model: "zhipuai/glm-4.5",
    description:
      "GLM 4.5 is a large language model with strong Chinese and English capabilities, excelling in reasoning and generation tasks.",
    capabilities: ["tools", "reasoning"],
    icon: "zai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM 4.5 Air",
    model: "z-ai/glm-4.5-air:free",
    description:
      "A lighter version of GLM 4.5 optimized for faster inference while maintaining good performance.",
    capabilities: ["tools", "reasoning"],
    icon: "zai",
    access: "public",
    pinned: true,
  },
  {
    id: "glm-4.5v",
    name: "GLM 4.5V",
    model: "zhipuai/glm-4.5v",
    description:
      "GLM 4.5V is a multimodal version with vision capabilities, able to process and understand images alongside text.",
    capabilities: ["tools", "reasoning", "vision"],
    icon: "zai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "gpt-4o",
    name: "GPT 4o",
    model: "openai/gpt-4o",
    description:
      "GPT-4o is OpenAI's flagship multimodal model with strong performance across text, vision, and reasoning tasks.",
    capabilities: ["tools", "reasoning", "vision", "documents"],
    icon: "openai",
    access: "account_required",
    pinned: false,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT 4o Mini",
    model: "openai/gpt-4o-mini",
    description:
      "A smaller, faster version of GPT-4o optimized for efficiency while maintaining strong capabilities.",
    capabilities: ["tools", "reasoning", "vision", "documents"],
    icon: "openai",
    access: "public",
    pinned: false,
  },
  {
    id: "gpt-5-nano",
    name: "GPT 5 Nano",
    model: "openai/gpt-5-nano",
    description:
      "GPT-5 Nano is an ultra-efficient model optimized for edge deployment and resource-constrained environments.",
    capabilities: ["tools", "reasoning"],
    icon: "openai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "gpt-oss-120b",
    name: "GPT OSS 120B",
    model: "openai/gpt-oss-120b",
    description:
      "An open-source variant of GPT with 120 billion parameters, offering strong performance for various language tasks.",
    capabilities: ["tools", "reasoning"],
    icon: "openai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "gpt-oss-20b",
    name: "GPT OSS 20B",
    model: "openai/gpt-oss-20b",
    description:
      "A smaller open-source GPT variant with 20 billion parameters, suitable for efficient deployment.",
    capabilities: ["tools", "reasoning"],
    icon: "openai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "grok-3",
    name: "Grok 3",
    model: "x-ai/grok-3",
    description:
      "Grok 3 is xAI's advanced language model with strong reasoning capabilities and real-time information access.",
    capabilities: ["tools", "reasoning"],
    icon: "xai",
    access: "premium_required",
    pinned: false,
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    model: "x-ai/grok-3-mini",
    description:
      "A compact version of Grok 3 optimized for faster inference while maintaining core capabilities.",
    capabilities: ["tools", "reasoning"],
    icon: "xai",
    access: "premium_required",
    pinned: false,
  },
];

export const pinnedModelIdsDefault: string[] = models
  .filter((m) => m.pinned)
  .map((m) => m.id);
