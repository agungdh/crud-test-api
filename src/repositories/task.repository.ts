import type { Task, TaskInput } from "../models/task";

export class TaskRepository {
	constructor(private readonly db: D1Database) {}

	async list(opts: { page: number; isCompleted?: boolean }): Promise<Task[]> {
		const perPage = 50;
		const offset = opts.page * perPage;

		const stmt =
			opts.isCompleted === undefined
				? this.db.prepare("SELECT * FROM tasks ORDER BY id LIMIT ? OFFSET ?").bind(perPage, offset)
				: this.db
						.prepare("SELECT * FROM tasks WHERE completed = ? ORDER BY id LIMIT ? OFFSET ?")
						.bind(opts.isCompleted ? 1 : 0, perPage, offset);

		const { results } = await stmt.all<Record<string, unknown>>();

		return results.map(toTask);
	}

	async findById(id: number): Promise<Task | null> {
		const row = await this.db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind(id)
			.first<Record<string, unknown>>();

		return row ? toTask(row) : null;
	}

	async findBySlug(slug: string): Promise<Task | null> {
		const row = await this.db
			.prepare("SELECT * FROM tasks WHERE slug = ?")
			.bind(slug)
			.first<Record<string, unknown>>();

		return row ? toTask(row) : null;
	}

	async create(task: TaskInput): Promise<Task> {
		const row = await this.db
			.prepare("INSERT INTO tasks (slug, name, description, completed, due_date) VALUES (?, ?, ?, ?, ?) RETURNING *")
			.bind(task.slug, task.name, task.description ?? null, task.completed ? 1 : 0, task.due_date)
			.first<Record<string, unknown>>();

		return toTask(row ?? {});
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();

		return (result.meta.changes ?? 0) > 0;
	}
}

function toTask(row: Record<string, unknown>): Task {
	return {
		id: Number(row.id),
		name: row.name as string,
		slug: row.slug as string,
		description: (row.description ?? undefined) as string | undefined,
		completed: Boolean(row.completed),
		due_date: row.due_date as string,
	};
}
