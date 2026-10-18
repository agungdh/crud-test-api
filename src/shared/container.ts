import { TaskRepository } from "../repositories/task.repository";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { TaskService } from "../services/task.service";
import { createDb } from "../db/client";

export interface Services {
	tasks: TaskService;
	auth: AuthService;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

export function buildServices(env: Env): Services {
	const db = createDb(env.DB);

	return {
		tasks: new TaskService(new TaskRepository(db)),
		auth: new AuthService(new UserRepository(db), {
			secret: env.AUTH_SECRET,
			ttlSeconds: TOKEN_TTL_SECONDS,
		}),
	};
}
