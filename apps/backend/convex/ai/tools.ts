export interface MessageWriter {
  writeMessageAnnotation(annotation: { type: string; data: any }): void;
}

export interface TokenState {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCost: number;
  [key: string]: any;
}

export interface GetToolsOpts {
  ctx: any;
  user: any;
  writer: MessageWriter;
  state: TokenState;
}

export type ImageGenerationAnnotation = {
  type: "image_generation_completion";
  data:
    | {
        prompt: string;
        status: "completed";
        imageUrl: string;
        key: string;
      }
    | {
        prompt: string;
        status: "failed";
      }
    | {
        prompt: string;
        status: "generating";
      };
};
