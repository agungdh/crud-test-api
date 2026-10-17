import type { HonoOpenAPIRouterType } from "chanfana";
import { registerAuthRoutes } from "./auth.routes";
import { registerTaskRoutes } from "./tasks.routes";

export function registerRoutes(openapi: HonoOpenAPIRouterType<any, any, any>) {
	registerAuthRoutes(openapi);
	registerTaskRoutes(openapi);
}
