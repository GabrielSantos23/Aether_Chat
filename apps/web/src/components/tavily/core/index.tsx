export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  query: string;
  follow_up_questions?: string[];
  answer?: string;
  results: TavilySearchResult[];
  response_time: number;
}

export interface TavilySearchOptions {
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  format?: "markdown" | "text";
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Tavily API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Perform a web search
   */
  async search(
    query: string,
    options: TavilySearchOptions = {}
  ): Promise<TavilySearchResponse> {
    const {
      searchDepth = "basic",
      maxResults = 5,
      includeAnswer = false,
      includeRawContent = false,
      includeImages = false,
      includeDomains = [],
      excludeDomains = [],
      format = "text",
    } = options;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }

    if (query.length > 400) {
      throw new Error("Search query too long (max 400 characters)");
    }

    const requestBody = {
      api_key: this.apiKey,
      query: query.trim(),
      search_depth: searchDepth,
      include_answer: includeAnswer,
      include_raw_content: includeRawContent,
      max_results: Math.min(Math.max(maxResults, 1), 20),
      include_images: includeImages,
      include_domains: includeDomains.length > 0 ? includeDomains : undefined,
      exclude_domains: excludeDomains.length > 0 ? excludeDomains : undefined,
      format,
    };

    try {
      const startTime = Date.now();

      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new TavilyError(
          `Search failed: ${errorMessage}`,
          response.status
        );
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        query,
        follow_up_questions: data.follow_up_questions || [],
        answer: data.answer || undefined,
        results: this.normalizeResults(data.results || []),
        response_time: responseTime,
      };
    } catch (error) {
      if (error instanceof TavilyError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TavilyError("Search request timed out", 408);
        }
        if (error.message.includes("fetch")) {
          throw new TavilyError("Network error during search", 0);
        }
      }

      throw new TavilyError(`Unexpected error: ${error}`, 0);
    }
  }

  async getContext(
    query: string,
    options: Omit<TavilySearchOptions, "includeAnswer"> = {}
  ): Promise<{ context: string; sources: string[] }> {
    const searchOptions: TavilySearchOptions = {
      ...options,
      includeAnswer: false,
      maxResults: options.maxResults || 5,
    };

    const result = await this.search(query, searchOptions);

    const context = result.results
      .map((r) => `${r.title}: ${r.content}`)
      .join("\n\n");

    const sources = result.results.map((r) => r.url);

    return { context, sources };
  }

  async searchRecent(
    query: string,
    options: TavilySearchOptions = {}
  ): Promise<TavilySearchResponse> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });

    let enhancedQuery = query;
    const recentTerms = ["recent", "latest", "last", "current", "this year"];
    const hasRecentTerm = recentTerms.some((term) =>
      query.toLowerCase().includes(term)
    );

    if (hasRecentTerm) {
      enhancedQuery = `${query} ${currentYear} ${currentMonth}`;
    }

    return this.search(enhancedQuery, {
      ...options,
      searchDepth: options.searchDepth || "advanced",
    });
  }

  async batchSearch(
    queries: string[],
    options: TavilySearchOptions = {}
  ): Promise<TavilySearchResponse[]> {
    if (queries.length === 0) {
      return [];
    }

    if (queries.length > 10) {
      throw new Error("Maximum 10 queries per batch");
    }

    const promises = queries.map(
      (query, index) =>
        new Promise<TavilySearchResponse>((resolve, reject) => {
          setTimeout(async () => {
            try {
              const result = await this.search(query, options);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, index * 100);
        })
    );

    return Promise.all(promises);
  }

  private normalizeResults(results: unknown[]): TavilySearchResult[] {
    return results
      .filter((result) => result && typeof result === "object")
      .map((result) => {
        const typedResult = result as Record<string, unknown>;
        return {
          title: this.sanitizeString(
            (typedResult.title as string) || "Untitled"
          ),
          url: this.validateUrl((typedResult.url as string) || "") || "",
          content: this.sanitizeString((typedResult.content as string) || ""),
          score:
            typeof typedResult.score === "number"
              ? Math.max(0, Math.min(1, typedResult.score))
              : 0,
          published_date: (typedResult.published_date as string) || undefined,
        };
      })
      .filter((result) => result.url && result.content);
  }

  private sanitizeString(str: string): string {
    if (typeof str !== "string") return "";

    return str
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);
  }

  private validateUrl(url: string): string | null {
    if (typeof url !== "string") return null;

    try {
      const parsedUrl = new URL(url);
      return ["http:", "https:"].includes(parsedUrl.protocol) ? url : null;
    } catch {
      return null;
    }
  }
}

export class TavilyError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "TavilyError";
    this.statusCode = statusCode;
  }
}

export function tavily(apiKey: string): TavilyClient {
  return new TavilyClient(apiKey);
}

export function createTavilySearchTool(apiKey: string) {
  const client = tavily(apiKey);

  return {
    search: client.search.bind(client),
    getContext: client.getContext.bind(client),
    searchRecent: client.searchRecent.bind(client),
    batchSearch: client.batchSearch.bind(client),
  };
}
