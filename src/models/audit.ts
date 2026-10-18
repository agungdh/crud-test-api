import { z } from "zod";

/**
 * Shared audit fields exposed in API responses.
 *
 * `*_at` are epoch milliseconds, `*_by` are user ids. All are nullable because
 * imported/seeded rows may not carry an actor or timestamp.
 */
export const auditFields = {
	created_at: z.number().int().nullable().describe("Created at (epoch milliseconds)"),
	updated_at: z.number().int().nullable().describe("Updated at (epoch milliseconds)"),
	deleted_at: z.number().int().nullable().describe("Deleted at (epoch milliseconds)"),
	created_by: z.number().int().nullable().describe("Created by (user id)"),
	updated_by: z.number().int().nullable().describe("Updated by (user id)"),
	deleted_by: z.number().int().nullable().describe("Deleted by (user id)"),
};

/** Keys to strip from request bodies (audit columns are server-managed). */
export const auditOmit = {
	created_at: true,
	updated_at: true,
	deleted_at: true,
	created_by: true,
	updated_by: true,
	deleted_by: true,
} as const;
