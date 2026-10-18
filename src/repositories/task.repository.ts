import { and, eq, type SQL } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { tasks, type TaskRow } from "../db/schema";
import type { TaskInput } from "../models/task";
import { SoftDeleteRepository } from "./base.repository";

/**
 * Every read and write is scoped to `user_id`, so a task can never be observed
 * or mutated through another user's session. Queries targeting someone else's
 * task simply return `null` — the repository is the ownership boundary.
 */
export class TaskRepository extends SoftDeleteRepository<typeof tasks> {
	constructor(db: AppDatabase) {
		super(db, tasks);
	}

	/** `user_id = :userId AND (:where)` — narrows any query to the owner. */
	private ownedBy(userId: number, where: SQL): SQL {
		return and(eq(tasks.user_id, userId), where) as SQL;
	}

	list(userId: number, opts: { page: number; isCompleted?: boolean }): Promise<TaskRow[]> {
		const where =
			opts.isCompleted === undefined ? eq(tasks.user_id, userId) : this.ownedBy(userId, eq(tasks.completed, opts.isCompleted));

		return this.findMany(where, { page: opts.page });
	}

	findOwnedById(userId: number, id: number): Promise<TaskRow | null> {
		return this.findFirst(this.ownedBy(userId, eq(tasks.id, id)));
	}

	findOwnedBySlug(userId: number, slug: string): Promise<TaskRow | null> {
		return this.findFirst(this.ownedBy(userId, eq(tasks.slug, slug)));
	}

	create(userId: number, task: TaskInput): Promise<TaskRow> {
		return this.insert(
			{
				user_id: userId,
				slug: task.slug,
				name: task.name,
				description: task.description ?? null,
				completed: task.completed,
				due_date: task.due_date,
			},
			userId,
		);
	}

	async delete(userId: number, id: number): Promise<boolean> {
		const row = await this.softDelete(this.ownedBy(userId, eq(tasks.id, id)), userId);

		return row !== null;
	}
}
