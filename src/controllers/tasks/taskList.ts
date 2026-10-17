import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { ListTasksQuery, TaskSchema } from "../../models/task";
import type { AppContext } from "../../shared/types";

export class TaskList extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "List Tasks",
		request: {
			query: ListTasksQuery,
		},
		responses: {
			"200": {
				description: "Returns a list of tasks",
				content: {
					"application/json": {
						schema: z.array(TaskSchema),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const { page, isCompleted } = (await this.getValidatedData<typeof this.schema>()).query;

		const tasks = await c.get("services").tasks.list({ page, isCompleted });

		return c.json(tasks);
	}
}
