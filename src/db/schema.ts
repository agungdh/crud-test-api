import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { auditColumns } from "./audit";

/**
 * Table keys intentionally mirror the database column names (snake_case) so the
 * selected rows map straight onto the API models without an extra mapper.
 *
 * Because rows are soft-deleted, every `UNIQUE` column uses a *partial* unique
 * index (`WHERE deleted_at IS NULL`) so a deleted row never blocks a new one.
 */

export const tasks = sqliteTable(
	"tasks",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		slug: text("slug").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		completed: integer("completed", { mode: "boolean" }).notNull().default(false),
		due_date: integer("due_date").notNull(),
		...auditColumns,
	},
	(t) => [
		uniqueIndex("tasks_slug_unique").on(t.slug).where(sql`${t.deleted_at} is null`),
		index("tasks_deleted_at_idx").on(t.deleted_at),
	],
);

export const users = sqliteTable(
	"users",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		email: text("email").notNull(),
		name: text("name").notNull(),
		password_hash: text("password_hash").notNull(),
		...auditColumns,
	},
	(t) => [
		uniqueIndex("users_email_unique").on(t.email).where(sql`${t.deleted_at} is null`),
		index("users_deleted_at_idx").on(t.deleted_at),
	],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
