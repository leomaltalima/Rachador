# Rachador

App web para dividir despesas entre amigos em viagens. Grupos com código de convite, lançamento de despesas com divisão automática, saldo simplificado e quitação via Pix.

## Run & Operate

- `pnpm --filter @workspace/rachador run dev` — frontend React/Vite (port assigned by artifact)
- `pnpm --filter @workspace/api-server run dev` — API Express 5 (port 8080 via proxy em /api)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter (routing) + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema: grupos, participantes, despesas, divisoes
- `artifacts/api-server/src/routes/` — Express routes: grupos, participantes, despesas, divisoes
- `artifacts/api-server/src/lib/saldo.ts` — balance simplification algorithm
- `artifacts/rachador/src/` — React frontend
- `artifacts/rachador/src/index.css` — Rachador design tokens (colors, fonts, radius)

## Architecture decisions

- **Zod v3 compatibility**: All OpenAPI types use `number` (not `integer`) to avoid `zod.int()` which is Zod v4-only. Path params are coerced with `zod.coerce.number()`.
- **No authentication**: Groups use shareable invite codes (6-char alphanumeric). Current participant stored in localStorage per group.
- **Balance simplification**: Greedy algorithm in `saldo.ts` minimizes the number of transfers needed to settle debts.
- **Numeric storage**: `valor` and `valorDevido` stored as `numeric(10,2)` strings in Postgres; parsed to `number` in route handlers before JSON response.
- **Invite code**: 6-char uppercase alphanumeric (excluding ambiguous chars I/O/0/1).

## Product

- Criar grupo com nome → receber código de convite para compartilhar
- Participantes entram via código de convite → adicionam nome e chave Pix opcional
- Lançar despesas: valor, quem pagou, divisão por participante
- Ver saldo simplificado: quem deve pra quem, quanto
- Quitar dívidas individualmente + copiar chave Pix do credor

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before editing routes: `pnpm --filter @workspace/api-spec run codegen`
- Do NOT use `type: integer` in openapi.yaml — use `type: number` to avoid Orval generating `zod.int()` (Zod v4-only)
- `valor` fields come back from Drizzle as strings (numeric type) — always `parseFloat()` before returning in JSON
- Run `pnpm --filter @workspace/db run push` after any schema change in `lib/db/src/schema/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
