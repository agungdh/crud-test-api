import { ConflictException, NotFoundException } from "chanfana";
import type { Task, TaskInput } from "../models/task";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskService {
	constructor(private readonly repo: TaskRepository) {}

	list(opts: { page: number; isCompleted?: boolean }): Promise<Task[]> {
		return this.repo.list(opts);
	}

	async get(id: number): Promise<Task> {
		const task = await this.repo.findById(id);

		if (!task) {
			throw new NotFoundException(`Task '${id}' not found`);
		}

		return task;
	}

	async create(task: TaskInput, actorId?: number): Promise<Task> {
		const existing = await this.repo.findBySlug(task.slug);

		if (existing) {
			throw new ConflictException(`Task '${task.slug}' already exists`);
		}

		return this.repo.create(task, actorId);
	}

	async delete(id: number, actorId?: number): Promise<Task> {
		const task = await this.get(id);

		await this.repo.delete(id, actorId);

		return task;
	}
}
