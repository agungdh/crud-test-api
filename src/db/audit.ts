import { integer } from "drizzle-orm/sqlite-core";

/**
 * Audit columns shared by every table.
 *
 * - `*_at` columns store epoch **milliseconds** (same INTEGER type as `id`).
 * - `*_by` columns store the acting user id (`users.id`).
 *
 * Every column is nullable so imported/seeded rows that carry no actor or
 * timestamp can be inserted as `NULL`. On normal writes the repositories fill
 * them in (see `SoftDeleteRepository`).
 */
export const auditColumns = {
	created_at: integer("created_at"),
	updated_at: integer("updated_at"),
	deleted_at: integer("deleted_at"),
	created_by: integer("created_by"),
	updated_by: integer("updated_by"),
	deleted_by: integer("deleted_by"),
};

/** Current time in epoch milliseconds — used for the audit `*_at` columns. */
export const nowMs = (): number => Date.now();

/** Current time in epoch seconds — used for non-audit date/time columns. */
export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
