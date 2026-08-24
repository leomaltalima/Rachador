---
name: Drizzle numeric columns as strings
description: Drizzle returns numeric()/decimal() column values as strings in JavaScript. Always parseFloat() before using or returning them.
---

**Rule:** Always call `parseFloat(row.valorColuna)` on `numeric()` columns before using or returning the value as a number.

**Why:** Drizzle ORM maps PostgreSQL `NUMERIC`/`DECIMAL` types to JavaScript strings to preserve precision. If you return them directly in JSON responses, the client receives strings instead of numbers, which breaks TypeScript types and frontend arithmetic.

**How to apply:** In every route handler that reads a `numeric()` column (e.g. `despesas.valor`, `divisoes.valorDevido`), do `parseFloat(row.valor)` before including it in the response object. Also applies when doing math (e.g. `reduce` sums over `valor`).
