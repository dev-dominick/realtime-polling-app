/**
 * Polls feature public API
 *
 * Export types and schemas usable from both client and server.
 * For client-only components and hooks, import from ./client
 * For server-only utilities, import directly from ./server/index.ts
 */

// Types only
export type { PollOption, PollData, PollFormOption } from "./types";

// Schemas (usable from both client and server)
export { createPollSchema, votePollSchema } from "./schemas";
export type { CreatePollInput, VotePollInput } from "./schemas";
