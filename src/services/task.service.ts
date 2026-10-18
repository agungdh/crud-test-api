import { ConflictException, NotFoundException } from "chanfana";
import type { Task, TaskInput } from "../models/task";
import type { TaskRepository } from "../repositories/task.repository";

/**
 * Tasks are private to their owner. Every method takes the acting `userId` and
 * scopes the query to it, so a task belonging to somebody else is reported as
 * `404 Not Found` rather than `403 Forbidden` — that way the API never reveals
 * whether another user's task exists.
 */
export class TaskService {
	constructor(private readonly repo: TaskRepository) {}

	list(userId: number, opts: { page: number; isCompleted?: boolean }): Promise<Task[]> {
		return this.repo.list(userId, opts);
	}

	async get(userId: number, id: number): Promise<Task> {
		const task = await this.repo.findOwnedById(userId, id);

		if (!task) {
			throw new NotFoundException(`Task '${id}' not found`);
		}

		return task;
	}

	async create(userId: number, task: TaskInput): Promise<Task> {
		const existing = await this.repo.findOwnedBySlug(userId, task.slug);

		if (existing) {
			throw new ConflictException(`Task '${task.slug}' already exists`);
		}

		return this.repo.create(userId, task);
	}

	async delete(userId: number, id: number): Promise<Task> {
		const task = await this.get(userId, id);

		await this.repo.delete(userId, id);

		return task;
	}
}
