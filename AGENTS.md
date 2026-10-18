# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Local development |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## Database & ORM (Drizzle + D1)

The data layer uses [Drizzle ORM](https://orm.drizzle.team/) on Cloudflare D1. The schema lives in `src/db/schema.ts` and the client is created per request in `src/db/client.ts`.

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate SQL migrations from `src/db/schema.ts` into `migrations/` |
| `npm run db:migrate:local` | Apply migrations to the local D1 database |
| `npm run db:migrate:remote` | Apply migrations to the remote D1 database |
| `make reset-local` | Wipe local D1 + R2 state, then re-apply migrations |
| `make d1-reset` / `make r2-reset` | Wipe local D1 / R2 state only |

Drizzle Kit only *generates* SQL; migrations are applied by Wrangler (`migrations_dir: "migrations"`), so generated files must stay in `migrations/`.

### Table conventions

Every table MUST include the audit columns (spread `auditColumns` from `src/db/audit.ts`):

| Column | Type | Notes |
|--------|------|-------|
| `created_at`, `updated_at`, `deleted_at` | INTEGER | epoch **milliseconds** (same INTEGER type as `id`) |
| `created_by`, `updated_by`, `deleted_by` | INTEGER | acting `users.id` |

All six are **nullable**, so imported/seeded rows without an actor or timestamp can be inserted as `NULL`; repositories fill them on normal writes.

- **Non-audit date/time columns use epoch seconds** (INTEGER). Only audit columns (and specific, documented columns) use milliseconds.
- Every table has an autoincrement INTEGER `id` primary key.
- Unique columns MUST use a **partial unique index** so soft-deleted rows never block a new row:

  ```ts
  uniqueIndex("tasks_slug_unique").on(t.slug).where(sql`${t.deleted_at} is null`)
  ```

  Upserts must repeat the predicate: `ON CONFLICT(email) WHERE deleted_at IS NULL DO UPDATE ...`.

### Soft delete

Deletes are soft (`deleted_at`/`deleted_by` are set, nothing is physically removed) and reads automatically exclude deleted rows.

- Repositories extend `SoftDeleteRepository` (`src/repositories/base.repository.ts`), which filters `deleted_at IS NULL` on every read, stamps audit columns on write, and turns `softDelete()` into an update.
- **Repositories are the only layer allowed to query the database.** Do not call `db.select()` from services/controllers — that bypasses the automatic soft-delete filter.
- Escape hatches (`findManyIncludingDeleted`, `restore`) cover the rare admin/restore cases.

## Local Explorer (Debugging & Inspection)

When running `npx wrangler dev`, a Local Explorer API is available for inspecting and debugging local Workers, bindings, and storage state. The API base URL is printed in the terminal when the dev server starts.

Key endpoints (relative to the dev server URL):

| Endpoint | Description |
|----------|-------------|
| `GET /cdn-cgi/local/explorer/api/local/workers` | List local Workers and their bindings |
| `GET /cdn-cgi/local/explorer/api/storage/kv/namespaces` | List KV namespaces |
| `GET /cdn-cgi/local/explorer/api/d1/database` | List D1 databases |
| `GET /cdn-cgi/local/explorer/api/r2/buckets` | List R2 buckets |
| `GET /cdn-cgi/local/explorer/api/workers/durable_objects/namespaces` | List Durable Object namespaces |
| `GET /cdn-cgi/local/explorer/api/workflows` | List Workflows |
| `POST /cdn-cgi/local/explorer/api/local/observability/query` | Run a read-only SQL query (SELECT/WITH only) over captured request traces and console logs. Tables: `spans`, `logs` (read attributes via `json(attributes)`). Example: `curl -X POST <base>/cdn-cgi/local/explorer/api/local/observability/query -H 'Content-Type: application/json' -d '{"sql":"SELECT service, name, outcome, duration_ms FROM spans WHERE parent_id IS NULL LIMIT 20"}'` |
| `POST /cdn-cgi/local/explorer/api/local/observability/clear` | Clear all captured traces and logs |

If the routes above don't cover what you need, fetch the full OpenAPI schema (large - use only as a last resort): `GET /cdn-cgi/local/explorer/api`

Use the Local Explorer to debug issues by inspecting storage state (KV keys, D1 rows, R2 objects, DO storage), viewing Worker bindings, and querying request traces and logs captured during the dev session.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## Best Practices (conditional)

If the application uses Durable Objects or Workflows, refer to the relevant best practices:

- Durable Objects: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workflows: https://developers.cloudflare.com/workflows/build/rules-of-workflows/
