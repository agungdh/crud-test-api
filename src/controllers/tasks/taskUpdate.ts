import { OpenAPIRoute } from "chanfana";
import { TaskIdParams, TaskSchema, UpdateTaskBody } from "../../models/task";
import { errorResponse, validationErrorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class TaskUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Replace a Task",
		security: [{ bearerAuth: [] }],
		request: {
			params: TaskIdParams,
			body: {
				content: {
					"application/json": {
						schema: UpdateTaskBody,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Task replaced",
				content: {
					"application/json": {
						schema: TaskSchema,
					},
				},
			},
			...validationErrorResponse(),
			...errorResponse(404, "Task not found"),
			...errorResponse(409, "Task already exists"),
		},
	};

	async handle(c: AppContext) {
		const { params, body } = await this.getValidatedData<typeof this.schema>();

		const task = await c.get("services").tasks.update(c.get("user").id, params.id, body);

		return c.json(task);
	}
}
