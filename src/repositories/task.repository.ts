import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { tasks, type TaskRow } from "../db/schema";
import type { TaskInput } from "../models/task";
import { SoftDeleteRepository } from "./base.repository";

export class TaskRepository extends SoftDeleteRepository<typeof tasks> {
	constructor(db: AppDatabase) {
		super(db, tasks);
	}

	list(opts: { page: number; isCompleted?: boolean }): Promise<TaskRow[]> {
		const where = opts.isCompleted === undefined ? undefined : eq(tasks.completed, opts.isCompleted);

		return this.findMany(where, { page: opts.page });
	}

	findById(id: number): Promise<TaskRow | null> {
		return super.findById(id);
	}

	findBySlug(slug: string): Promise<TaskRow | null> {
		return this.findFirst(eq(tasks.slug, slug));
	}

	create(task: TaskInput, actorId?: number): Promise<TaskRow> {
		return this.insert(
			{
				slug: task.slug,
				name: task.name,
				description: task.description ?? null,
				completed: task.completed,
				due_date: task.due_date,
			},
			actorId,
		);
	}

	async delete(id: number, actorId?: number): Promise<boolean> {
		const row = await this.softDelete(eq(tasks.id, id), actorId);

		return row !== null;
	}
}
