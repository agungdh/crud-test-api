import { ConflictException, NotFoundException } from "chanfana";
import type { Task } from "../models/task";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskService {
	constructor(private readonly repo: TaskRepository) {}

	list(opts: { page: number; isCompleted?: boolean }): Promise<Task[]> {
		return this.repo.list(opts);
	}

	async get(slug: string): Promise<Task> {
		const task = await this.repo.findBySlug(slug);

		if (!task) {
			throw new NotFoundException(`Task '${slug}' not found`);
		}

		return task;
	}

	async create(task: Task): Promise<Task> {
		const existing = await this.repo.findBySlug(task.slug);

		if (existing) {
			throw new ConflictException(`Task '${task.slug}' already exists`);
		}

		return this.repo.create(task);
	}

	async delete(slug: string): Promise<Task> {
		const task = await this.get(slug);

		await this.repo.delete(slug);

		return task;
	}
}
