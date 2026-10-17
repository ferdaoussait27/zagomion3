# Galakidd

An interactive, ten-step space-station mission where children help Nova learn about life support and protecting Earth.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/life-space/src/App.tsx` — mission lesson content, answer validation, and progress state
- `artifacts/life-space/src/index.css` — app styles and responsive layout
- `artifacts/life-space/.replit-artifact/artifact.toml` — web artifact and preview configuration

## Architecture decisions

- Mission progress is stored locally in the browser; the app has no accounts or server-side progress sync.
- A step is marked complete only after successful validation; the next step opens only after the child explicitly continues.
- The water-recovery activity starts in an incorrect order so validation requires the child to rearrange it.

## Product

- Ten child-friendly astronaut activities covering food, water, air, hygiene, exercise, sleep, plants, waste, and Earth ecosystems
- Step-specific answer checks, gentle retry feedback, and concise science explanations
- Saved progress, restart confirmation, and a mission completion screen

## User preferences

- Keep content suitable for ages 7–11 and explain science in simple, accurate language.
- Do not automatically advance mission steps.

## Gotchas

- When changing step content, keep its activity controls and `validate()` correctness rules aligned.
- Progress persists in the current browser's local storage and is not shared between devices.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
