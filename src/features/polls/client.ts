"use client";

/**
 * Polls feature client-only exports
 *
 * This file is marked "use client" and contains only components,
 * hooks, and utilities safe for browser execution.
 */

// Components (client-side only)
export { PollForm } from "./components/PollForm";
export { PollVote } from "./components/PollVote";
export { PollResults } from "./components/PollResults";
export { PollShare } from "./components/PollShare";

// Hooks (client-side only)
export { usePoll, usePollResults } from "./hooks";
