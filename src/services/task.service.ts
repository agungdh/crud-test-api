import { ConflictException, NotFoundException } from "chanfana";
import type { TaskRow } from "../db/schema";
import type { Task, TaskInput, UpdateTaskInput } from "../models/task";
import type { TaskRepository } from "../repositories/task.repository";

/** Map a database row onto the public API model, dropping audit columns. */
const toTask = (row: TaskRow): Task => ({
	id: row.id,
	name: row.name,
	slug: row.slug,
	description: row.description,
	completed: row.completed,
	due_date: row.due_date,
});

/**
 * Tasks are private to their owner. Every method takes the acting `userId` and
 * scopes the query to it, so a task belonging to somebody else is reported as
 * `404 Not Found` rather than `403 Forbidden` — that way the API never reveals
 * whether another user's task exists.
 */
export class TaskService {
	constructor(private readonly repo: TaskRepository) {}

	async list(userId: number, opts: { page: number; isCompleted?: boolean }): Promise<Task[]> {
		const rows = await this.repo.list(userId, opts);

		return rows.map(toTask);
	}

	async get(userId: number, id: number): Promise<Task> {
		const task = await this.repo.findOwnedById(userId, id);

		if (!task) {
			throw new NotFoundException(`Task '${id}' not found`);
		}

		return toTask(task);
	}

	async create(userId: number, task: TaskInput): Promise<Task> {
		const existing = await this.repo.findOwnedBySlug(userId, task.slug);

		if (existing) {
			throw new ConflictException(`Task '${task.slug}' already exists`);
		}

		return toTask(await this.repo.create(userId, task));
	}

	async update(userId: number, id: number, task: UpdateTaskInput): Promise<Task> {
		const existing = await this.get(userId, id);

		if (task.slug !== existing.slug) {
			const slugOwner = await this.repo.findOwnedBySlug(userId, task.slug);

			if (slugOwner && slugOwner.id !== id) {
				throw new ConflictException(`Task '${task.slug}' already exists`);
			}
		}

		const updated = await this.repo.replaceOwned(userId, id, task);

		if (!updated) {
			throw new NotFoundException(`Task '${id}' not found`);
		}

		return toTask(updated);
	}

	async delete(userId: number, id: number): Promise<Task> {
		const task = await this.get(userId, id);

		await this.repo.delete(userId, id);

		return task;
	}
}
