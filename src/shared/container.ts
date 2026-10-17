import { TaskRepository } from "../repositories/task.repository";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { TaskService } from "../services/task.service";

export interface Services {
	tasks: TaskService;
	auth: AuthService;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

export function buildServices(env: Env): Services {
	return {
		tasks: new TaskService(new TaskRepository(env.DB)),
		auth: new AuthService(new UserRepository(env.DB), {
			secret: env.AUTH_SECRET,
			ttlSeconds: TOKEN_TTL_SECONDS,
		}),
	};
}
