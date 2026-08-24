---
name: Zod v3 + Orval integer types
description: Orval generates zod.int() for OpenAPI integer types, but zod.int() is Zod v4-only. Use type: number in openapi.yaml to keep compatibility.
---

**Rule:** Never use `type: integer` in `lib/api-spec/openapi.yaml`. Use `type: number` instead.

**Why:** This project uses Zod v3 (`zod@3.x`). When Orval sees `type: integer`, it generates `zod.int()` in the Zod output. But `zod.int()` is a Zod v4 API method that does not exist in v3. This causes `pnpm run typecheck:libs` to fail with `Property 'int' does not exist on type 'typeof import("zod")'`.

**How to apply:** For every integer field (IDs, counts, etc.) in the OpenAPI spec, write `type: number`. Orval will generate `zod.number()` which works fine in v3. Path and query params coerce correctly via `zod.coerce.number()` in the generated Params schemas.
