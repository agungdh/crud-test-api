import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";

export interface Services {
	tasks: TaskService;
}

export function buildServices(env: Env): Services {
	return {
		tasks: new TaskService(new TaskRepository(env.DB)),
	};
}
