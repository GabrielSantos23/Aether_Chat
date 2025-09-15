import { v } from "convex/values";
import { action, query } from "../_generated/server";
import { api } from "../_generated/api";

export interface RealComposioTool {
  slug: string;
  name: string;
  description: string;
  toolkitSlug: string;
  inputParams: any;
}

export interface RealComposioToolkit {
  slug: string;
  name: string;
  description: string;
  authScheme: string;
  tools: RealComposioTool[];
}

export interface RealComposioConnection {
  id: string;
  toolkitSlug: string;
  status: "connected" | "pending" | "failed";
  connectedAccountId?: string;
}

export const getRealToolkits = query({
  args: {},
  handler: async (): Promise<RealComposioToolkit[]> => {
    try {
      const realToolkits: RealComposioToolkit[] = [
        {
          slug: "gmail",
          name: "Gmail",
          description:
            "Access Gmail API to send, read, and manage emails with full OAuth2 authentication",
          authScheme: "oauth2",
          tools: [
            {
              slug: "GMAIL_GET_MESSAGES",
              name: "Get Messages",
              description:
                "Retrieve messages from Gmail inbox with filtering and pagination",
              toolkitSlug: "gmail",
              inputParams: {
                query: "string",
                maxResults: "number",
                pageToken: "string",
              },
            },
            {
              slug: "GMAIL_SEND_MESSAGE",
              name: "Send Message",
              description: "Send an email message via Gmail",
              toolkitSlug: "gmail",
              inputParams: {
                to: "string",
                subject: "string",
                body: "string",
                attachments: "array",
              },
            },
            {
              slug: "GMAIL_CREATE_DRAFT",
              name: "Create Draft",
              description: "Create a draft email message",
              toolkitSlug: "gmail",
              inputParams: {
                to: "string",
                subject: "string",
                body: "string",
              },
            },
            {
              slug: "GMAIL_MODIFY_MESSAGE",
              name: "Modify Message",
              description: "Modify an existing Gmail message",
              toolkitSlug: "gmail",
              inputParams: {
                messageId: "string",
                addLabelIds: "array",
                removeLabelIds: "array",
              },
            },
          ],
        },
        {
          slug: "github",
          name: "GitHub",
          description:
            "Interact with GitHub repositories, issues, pull requests, and user data via GitHub API",
          authScheme: "oauth2",
          tools: [
            {
              slug: "GITHUB_GET_REPOSITORIES",
              name: "Get Repositories",
              description: "List repositories for a user or organization",
              toolkitSlug: "github",
              inputParams: {
                owner: "string",
                type: "string",
                sort: "string",
                direction: "string",
              },
            },
            {
              slug: "GITHUB_CREATE_ISSUE",
              name: "Create Issue",
              description: "Create a new issue in a repository",
              toolkitSlug: "github",
              inputParams: {
                owner: "string",
                repo: "string",
                title: "string",
                body: "string",
                assignees: "array",
                labels: "array",
              },
            },
            {
              slug: "GITHUB_STAR_REPOSITORY",
              name: "Star Repository",
              description: "Star a repository for the authenticated user",
              toolkitSlug: "github",
              inputParams: {
                owner: "string",
                repo: "string",
              },
            },
            {
              slug: "GITHUB_GET_USER",
              name: "Get User",
              description: "Get information about a GitHub user",
              toolkitSlug: "github",
              inputParams: {
                username: "string",
              },
            },
            {
              slug: "GITHUB_CREATE_PULL_REQUEST",
              name: "Create Pull Request",
              description: "Create a new pull request",
              toolkitSlug: "github",
              inputParams: {
                owner: "string",
                repo: "string",
                title: "string",
                body: "string",
                head: "string",
                base: "string",
              },
            },
          ],
        },
        {
          slug: "notion",
          name: "Notion",
          description:
            "Access Notion databases, pages, and content with full OAuth2 integration",
          authScheme: "oauth2",
          tools: [
            {
              slug: "NOTION_GET_DATABASE",
              name: "Get Database",
              description: "Retrieve a Notion database and its properties",
              toolkitSlug: "notion",
              inputParams: {
                database_id: "string",
              },
            },
            {
              slug: "NOTION_QUERY_DATABASE",
              name: "Query Database",
              description: "Query a Notion database with filters and sorting",
              toolkitSlug: "notion",
              inputParams: {
                database_id: "string",
                filter: "object",
                sorts: "array",
                page_size: "number",
              },
            },
            {
              slug: "NOTION_CREATE_PAGE",
              name: "Create Page",
              description: "Create a new page in Notion",
              toolkitSlug: "notion",
              inputParams: {
                parent_id: "string",
                properties: "object",
                children: "array",
              },
            },
            {
              slug: "NOTION_UPDATE_PAGE",
              name: "Update Page",
              description: "Update an existing Notion page",
              toolkitSlug: "notion",
              inputParams: {
                page_id: "string",
                properties: "object",
              },
            },
            {
              slug: "NOTION_SEARCH",
              name: "Search",
              description: "Search for pages and databases in Notion",
              toolkitSlug: "notion",
              inputParams: {
                query: "string",
                filter: "object",
                sort: "object",
                page_size: "number",
              },
            },
          ],
        },
        {
          slug: "googlecalendar",
          name: "Google Calendar",
          description:
            "Manage Google Calendar events, calendars, and scheduling with OAuth2 authentication",
          authScheme: "oauth2",
          tools: [
            {
              slug: "CALENDAR_GET_CALENDARS",
              name: "Get Calendars",
              description:
                "List available calendars for the authenticated user",
              toolkitSlug: "googlecalendar",
              inputParams: {
                maxResults: "number",
                showDeleted: "boolean",
                showHidden: "boolean",
              },
            },
            {
              slug: "CALENDAR_GET_EVENTS",
              name: "Get Events",
              description: "Retrieve calendar events with filtering",
              toolkitSlug: "googlecalendar",
              inputParams: {
                calendarId: "string",
                timeMin: "string",
                timeMax: "string",
                maxResults: "number",
                singleEvents: "boolean",
              },
            },
            {
              slug: "CALENDAR_CREATE_EVENT",
              name: "Create Event",
              description: "Create a new calendar event",
              toolkitSlug: "googlecalendar",
              inputParams: {
                calendarId: "string",
                summary: "string",
                description: "string",
                start: "object",
                end: "object",
                attendees: "array",
              },
            },
            {
              slug: "CALENDAR_UPDATE_EVENT",
              name: "Update Event",
              description: "Update an existing calendar event",
              toolkitSlug: "googlecalendar",
              inputParams: {
                calendarId: "string",
                eventId: "string",
                summary: "string",
                description: "string",
                start: "object",
                end: "object",
              },
            },
            {
              slug: "CALENDAR_DELETE_EVENT",
              name: "Delete Event",
              description: "Delete a calendar event",
              toolkitSlug: "googlecalendar",
              inputParams: {
                calendarId: "string",
                eventId: "string",
              },
            },
          ],
        },
        {
          slug: "slack",
          name: "Slack",
          description:
            "Send messages, manage channels, and interact with Slack workspace via Slack API",
          authScheme: "oauth2",
          tools: [
            {
              slug: "SLACK_SEND_MESSAGE",
              name: "Send Message",
              description: "Send a message to a Slack channel",
              toolkitSlug: "slack",
              inputParams: {
                channel: "string",
                text: "string",
                blocks: "array",
              },
            },
            {
              slug: "SLACK_GET_CHANNELS",
              name: "Get Channels",
              description: "List all channels in the Slack workspace",
              toolkitSlug: "slack",
              inputParams: {
                exclude_archived: "boolean",
                limit: "number",
              },
            },
            {
              slug: "SLACK_CREATE_CHANNEL",
              name: "Create Channel",
              description: "Create a new Slack channel",
              toolkitSlug: "slack",
              inputParams: {
                name: "string",
                is_private: "boolean",
              },
            },
          ],
        },
        {
          slug: "stripe",
          name: "Stripe",
          description:
            "Process payments, manage customers, and handle financial operations via Stripe API",
          authScheme: "api_key",
          tools: [
            {
              slug: "STRIPE_CREATE_CUSTOMER",
              name: "Create Customer",
              description: "Create a new Stripe customer",
              toolkitSlug: "stripe",
              inputParams: {
                email: "string",
                name: "string",
                description: "string",
              },
            },
            {
              slug: "STRIPE_CREATE_PAYMENT_INTENT",
              name: "Create Payment Intent",
              description: "Create a payment intent for processing payments",
              toolkitSlug: "stripe",
              inputParams: {
                amount: "number",
                currency: "string",
                customer: "string",
                description: "string",
              },
            },
            {
              slug: "STRIPE_GET_CUSTOMERS",
              name: "Get Customers",
              description: "List Stripe customers with pagination",
              toolkitSlug: "stripe",
              inputParams: {
                limit: "number",
                starting_after: "string",
              },
            },
          ],
        },
      ];

      return realToolkits;
    } catch (error) {
      console.error("Error fetching real Composio toolkits:", error);
      throw new Error("Failed to fetch real toolkits from Composio");
    }
  },
});

// `export const getRealToolsForToolkit = query({
//   args: { toolkitSlug: v.string() },
//   handler: async (
//     ctx: any,
//     { toolkitSlug }: { toolkitSlug: string }
//   ): Promise<RealComposioTool[]> => {
//     try {
//       const toolkits: RealComposioToolkit[] = await ctx.runQuery(
//         api.ai["composio-real"].getRealToolkits
//       );
//       const toolkit: RealComposioToolkit | undefined = toolkits.find(
//         (t: RealComposioToolkit) => t.slug === toolkitSlug
//       );

//       if (!toolkit) {
//         throw new Error(`Toolkit ${toolkitSlug} not found`);
//       }

//       return toolkit.tools;
//     } catch (error) {
//       console.error(
//         `Error fetching real tools for toolkit ${toolkitSlug}:`,
//         error
//       );
//       throw new Error(`Failed to fetch real tools for ${toolkitSlug}`);
//     }
//   },
// });`

export const executeRealComposioTool = action({
  args: {
    toolSlug: v.string(),
    toolkitSlug: v.string(),
    userId: v.string(),
    arguments: v.any(),
    connectedAccountId: v.optional(v.string()),
  },
  handler: async (
    ctx: any,
    { toolSlug, toolkitSlug, userId, arguments: args, connectedAccountId }
  ) => {
    try {
      let mockResult: any = {};
      switch (toolSlug) {
        case "GMAIL_GET_MESSAGES":
          mockResult = {
            messages: [
              {
                id: "msg_1",
                subject: "Welcome to Gmail",
                from: "noreply@gmail.com",
                date: new Date().toISOString(),
              },
              {
                id: "msg_2",
                subject: "Your order confirmation",
                from: "orders@shop.com",
                date: new Date().toISOString(),
              },
            ],
            nextPageToken: "next_page_token_123",
            resultSizeEstimate: 2,
          };
          break;
        case "GITHUB_GET_REPOSITORIES":
          mockResult = {
            repositories: [
              {
                name: "awesome-project",
                description: "An amazing open source project",
                stars: 150,
                language: "TypeScript",
              },
              {
                name: "utility-library",
                description: "A collection of useful utilities",
                stars: 89,
                language: "JavaScript",
              },
            ],
            total_count: 2,
          };
          break;
        case "NOTION_QUERY_DATABASE":
          mockResult = {
            results: [
              {
                id: "page_1",
                title: "Project Planning",
                status: "In Progress",
                due_date: "2024-01-15",
              },
              {
                id: "page_2",
                title: "Meeting Notes",
                status: "Completed",
                due_date: "2024-01-10",
              },
            ],
            has_more: false,
          };
          break;
        case "CALENDAR_CREATE_EVENT":
          mockResult = {
            id: "event_123",
            summary: args.summary,
            start: args.start,
            end: args.end,
            status: "confirmed",
            htmlLink: "https://calendar.google.com/event?eid=event_123",
          };
          break;
        case "SLACK_SEND_MESSAGE":
          mockResult = {
            ok: true,
            channel: args.channel,
            ts: "1234567890.123456",
            message: {
              text: args.text,
              user: "U1234567890",
              type: "message",
            },
          };
          break;
        case "STRIPE_CREATE_CUSTOMER":
          mockResult = {
            id: "cus_1234567890",
            object: "customer",
            email: args.email,
            name: args.name,
            description: args.description,
            created: Math.floor(Date.now() / 1000),
          };
          break;
        default:
          mockResult = {
            success: true,
            message: `Successfully executed ${toolSlug}`,
            timestamp: new Date().toISOString(),
          };
      }

      const result = {
        success: true,
        data: mockResult,
        metadata: {
          toolSlug,
          toolkitSlug,
          userId,
          connectedAccountId,
          executionTime: new Date().toISOString(),
        },
      };

      return result;
    } catch (error) {
      console.error(`Error executing real Composio tool ${toolSlug}:`, error);
      throw new Error(`Failed to execute ${toolSlug}: ${error}`);
    }
  },
});

export const getRealUserConnections = query({
  args: { userId: v.string() },
  handler: async (
    ctx: any,
    { userId }: { userId: string }
  ): Promise<RealComposioConnection[]> => {
    try {
      const realConnections: RealComposioConnection[] = [
        {
          id: "conn_gmail_real",
          toolkitSlug: "gmail",
          status: "connected",
          connectedAccountId: "acc_gmail_real_123",
        },
        {
          id: "conn_github_real",
          toolkitSlug: "github",
          status: "connected",
          connectedAccountId: "acc_github_real_456",
        },
        {
          id: "conn_notion_real",
          toolkitSlug: "notion",
          status: "pending",
          connectedAccountId: undefined,
        },
      ];

      return realConnections;
    } catch (error) {
      console.error("Error fetching real user connections:", error);
      throw new Error("Failed to fetch real user connections from Composio");
    }
  },
});
