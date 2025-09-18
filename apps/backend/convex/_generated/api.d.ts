/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts from "../accounts.js";
import type * as ai_composio_real from "../ai/composio_real.js";
import type * as ai_prompt from "../ai/prompt.js";
import type * as ai_provider from "../ai/provider.js";
import type * as ai_research from "../ai/research.js";
import type * as ai_tools from "../ai/tools.js";
import type * as api_keys from "../api_keys.js";
import type * as chat_actions from "../chat/actions.js";
import type * as chat_mutations from "../chat/mutations.js";
import type * as chat_node from "../chat/node.js";
import type * as chat_queries from "../chat/queries.js";
import type * as chat_shared from "../chat/shared.js";
import type * as constants from "../constants.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_validation from "../lib/validation.js";
import type * as limits from "../limits.js";
import type * as myFunctions from "../myFunctions.js";
import type * as research from "../research.js";
import type * as todos from "../todos.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  "ai/composio_real": typeof ai_composio_real;
  "ai/prompt": typeof ai_prompt;
  "ai/provider": typeof ai_provider;
  "ai/research": typeof ai_research;
  "ai/tools": typeof ai_tools;
  api_keys: typeof api_keys;
  "chat/actions": typeof chat_actions;
  "chat/mutations": typeof chat_mutations;
  "chat/node": typeof chat_node;
  "chat/queries": typeof chat_queries;
  "chat/shared": typeof chat_shared;
  constants: typeof constants;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/validation": typeof lib_validation;
  limits: typeof limits;
  myFunctions: typeof myFunctions;
  research: typeof research;
  todos: typeof todos;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
