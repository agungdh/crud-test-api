import type { Context } from "hono";
import type { Services } from "./container";

export interface AppEnv {
	Bindings: Env;
	Variables: {
		services: Services;
	};
}

export type AppContext = Context<AppEnv>;
