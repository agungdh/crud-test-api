import { OpenAPIRoute } from "chanfana";
import { TaskIdParams, TaskSchema } from "../../models/task";
import { errorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class TaskFetch extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Get a single Task by id",
		request: {
			params: TaskIdParams,
		},
		responses: {
			"200": {
				description: "Returns a single task if found",
				content: {
					"application/json": {
						schema: TaskSchema,
					},
				},
			},
			...errorResponse(404, "Task not found"),
		},
	};

	async handle(c: AppContext) {
		const { id } = (await this.getValidatedData<typeof this.schema>()).params;

		const task = await c.get("services").tasks.get(id);

		return c.json(task);
	}
}
