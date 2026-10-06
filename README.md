# Real-Time Polling App

A full-stack polling application built with Next.js, React, TypeScript, PostgreSQL, and Server-Sent Events.

## Highlights

- Poll creation with multiple options
- PostgreSQL-backed persistence
- Voting and vote aggregation
- Duplicate-vote protection
- Voter fingerprint handling
- Live result updates with Server-Sent Events
- Zod validation
- Animated result visualization
- Unit and component tests

## Architecture

Polling UI, hooks, schemas, and voter identity logic live in `src/features/polls`.

Polls, options, and votes are persisted in PostgreSQL. The API exposes creation, retrieval, voting, deletion, and live result streaming.

The client subscribes to poll result updates through Server-Sent Events so vote totals can refresh without page reloads.

## Stack

Next.js 16, React 19, TypeScript, PostgreSQL, Server-Sent Events, Tailwind CSS, Zod, Framer Motion, Vitest, and Testing Library.

## Local setup

1. Create a PostgreSQL database named `realtime_polling_app`
2. Copy `.env.example` to `.env.local`
3. Apply `db/migrations/006_polls.sql`
4. Apply `db/migrations/009_poll_votes_ip_fingerprint.sql`
5. Run `pnpm install`
6. Run `pnpm dev`

Open `http://localhost:3000/projects/polls`.

## Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
