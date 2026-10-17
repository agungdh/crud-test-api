import { NotFoundException, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { TaskIdParams, TaskSchema } from "../../models/task";
import { success } from "../../shared/http";
import type { AppContext } from "../../shared/types";

export class TaskDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Delete a Task",
		request: {
			params: TaskIdParams,
		},
		responses: {
			"200": {
				description: "Returns if the task was deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.literal(true),
							result: z.object({
								task: TaskSchema,
							}),
						}),
					},
				},
			},
			...NotFoundException.schema(),
		},
	};

	async handle(c: AppContext) {
		const { id } = (await this.getValidatedData<typeof this.schema>()).params;

		const task = await c.get("services").tasks.delete(id);

		return success({ task });
	}
}
