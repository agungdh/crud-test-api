import { isNull, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

/**
 * `deleted_at IS NULL` — the predicate that keeps soft-deleted rows hidden.
 *
 * Apply it to every read so callers never have to remember the filter.
 */
export function notDeleted(deletedAt: SQLiteColumn): SQL {
	return isNull(deletedAt) as SQL;
}
