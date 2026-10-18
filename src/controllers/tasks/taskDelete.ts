import { OpenAPIRoute } from "chanfana";
import { TaskIdParams } from "../../models/task";
import { errorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class TaskDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Delete a Task",
		security: [{ bearerAuth: [] }],
		request: {
			params: TaskIdParams,
		},
		responses: {
			"204": {
				description: "Task deleted",
			},
			...errorResponse(404, "Task not found"),
		},
	};

	async handle(c: AppContext) {
		const { id } = (await this.getValidatedData<typeof this.schema>()).params;

		await c.get("services").tasks.delete(c.get("user").id, id);

		return c.body(null, 204);
	}
}
