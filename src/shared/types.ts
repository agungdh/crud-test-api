import type { Context } from "hono";
import type { Services } from "./container";

export interface AuthUser {
	id: number;
	email: string;
}

export interface AppEnv {
	Bindings: Env;
	Variables: {
		services: Services;
		user: AuthUser;
	};
}

export type AppContext = Context<AppEnv>;
