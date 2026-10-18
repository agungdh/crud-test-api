import { and, eq, getTableColumns, type SQL } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { AppDatabase } from "../db/client";
import { nowMs } from "../db/audit";
import { notDeleted } from "../db/soft-delete";

/**
 * Base repository with automatic soft-delete behaviour.
 *
 * Every table that mixes in `auditColumns` gets:
 * - reads that always exclude rows where `deleted_at IS NOT NULL`;
 * - inserts/updates that stamp `created_at`/`updated_at` (epoch ms) and the
 *   acting user id;
 * - `softDelete()` which sets `deleted_at`/`deleted_by` instead of running a
 *   physical `DELETE`.
 *
 * Repositories are the only layer allowed to touch the database, so filtering
 * here covers the whole application. Use the `*IncludingDeleted` escape hatches
 * for the rare cases (admin/restore) that need deleted rows.
 */
export abstract class SoftDeleteRepository<TTable extends SQLiteTable> {
	protected readonly db: AppDatabase;
	protected readonly table: TTable;
	private readonly deletedAtColumn: SQLiteColumn;
	private readonly idColumn: SQLiteColumn;

	constructor(db: AppDatabase, table: TTable) {
		this.db = db;
		this.table = table;

		const columns = getTableColumns(table) as Record<string, SQLiteColumn>;
		this.deletedAtColumn = columns["deleted_at"]!;
		this.idColumn = columns["id"]!;
	}

	/** `and(deleted_at IS NULL, where)` — the visibility filter for every read. */
	protected visible(where?: SQL): SQL {
		const base = notDeleted(this.deletedAtColumn);

		return where ? (and(base, where) as SQL) : base;
	}

	protected get deletedAt(): SQLiteColumn {
		return this.deletedAtColumn;
	}

	async findMany(where?: SQL, opts: { page?: number; perPage?: number } = {}): Promise<TTable["$inferSelect"][]> {
		const perPage = opts.perPage ?? 50;
		const offset = (opts.page ?? 0) * perPage;

		const rows = await this.db.select().from(this.table).where(this.visible(where)).limit(perPage).offset(offset);

		return rows as TTable["$inferSelect"][];
	}

	async findFirst(where?: SQL): Promise<TTable["$inferSelect"] | null> {
		const rows = await this.db.select().from(this.table).where(this.visible(where)).limit(1);

		return (rows[0] as TTable["$inferSelect"] | undefined) ?? null;
	}

	async findById(id: number): Promise<TTable["$inferSelect"] | null> {
		return this.findFirst(eq(this.idColumn, id));
	}

	async insert(values: Partial<TTable["$inferInsert"]>, actorId?: number): Promise<TTable["$inferSelect"]> {
		const now = nowMs();

		const rows = await this.db
			.insert(this.table)
			.values({
				...values,
				created_at: now,
				updated_at: now,
				created_by: actorId ?? null,
				updated_by: actorId ?? null,
			} as TTable["$inferInsert"])
			.returning();

		return rows[0] as TTable["$inferSelect"];
	}

	async update(where: SQL, values: Partial<TTable["$inferInsert"]>, actorId?: number): Promise<TTable["$inferSelect"] | null> {
		const rows = await this.db
			.update(this.table)
			.set({
				...values,
				updated_at: nowMs(),
				updated_by: actorId ?? null,
			} as Partial<TTable["$inferInsert"]>)
			.where(this.visible(where))
			.returning();

		return (rows[0] as TTable["$inferSelect"] | undefined) ?? null;
	}

	/** Soft delete: marks the row instead of removing it. */
	async softDelete(where: SQL, actorId?: number): Promise<TTable["$inferSelect"] | null> {
		const rows = await this.db
			.update(this.table)
			.set({
				deleted_at: nowMs(),
				deleted_by: actorId ?? null,
			} as Partial<TTable["$inferInsert"]>)
			.where(this.visible(where))
			.returning();

		return (rows[0] as TTable["$inferSelect"] | undefined) ?? null;
	}

	/** Escape hatch: read deleted rows too. */
	protected async findManyIncludingDeleted(
		where?: SQL,
		opts: { page?: number; perPage?: number } = {},
	): Promise<TTable["$inferSelect"][]> {
		const perPage = opts.perPage ?? 50;
		const offset = (opts.page ?? 0) * perPage;

		const query = this.db.select().from(this.table);
		const rows = await (where ? query.where(where) : query).limit(perPage).offset(offset);

		return rows as TTable["$inferSelect"][];
	}

	/** Escape hatch: restore a soft-deleted row. */
	protected async restore(where: SQL): Promise<TTable["$inferSelect"] | null> {
		const rows = await this.db
			.update(this.table)
			.set({ deleted_at: null, deleted_by: null } as Partial<TTable["$inferInsert"]>)
			.where(where)
			.returning();

		return (rows[0] as TTable["$inferSelect"] | undefined) ?? null;
	}
}
