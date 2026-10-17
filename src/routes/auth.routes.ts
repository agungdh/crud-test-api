import type { HonoOpenAPIRouterType } from "chanfana";
import { AuthLogin } from "../controllers/auth/authLogin";
import { AuthMe } from "../controllers/auth/authMe";

export function registerAuthRoutes(openapi: HonoOpenAPIRouterType<any, any, any>) {
	openapi.post("/api/auth/login", AuthLogin);
	openapi.get("/api/auth/me", AuthMe);
}
