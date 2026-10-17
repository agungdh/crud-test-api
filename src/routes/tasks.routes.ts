import type { HonoOpenAPIRouterType } from "chanfana";
import { TaskCreate } from "../controllers/tasks/taskCreate";
import { TaskDelete } from "../controllers/tasks/taskDelete";
import { TaskFetch } from "../controllers/tasks/taskFetch";
import { TaskList } from "../controllers/tasks/taskList";

export function registerTaskRoutes(openapi: HonoOpenAPIRouterType<any, any, any>) {
	openapi.get("/api/tasks", TaskList);
	openapi.post("/api/tasks", TaskCreate);
	openapi.get("/api/tasks/:id", TaskFetch);
	openapi.delete("/api/tasks/:id", TaskDelete);
}
