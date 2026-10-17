import { NotFoundException, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { TaskSchema, TaskSlugParams } from "../../models/task";
import { success } from "../../shared/http";
import type { AppContext } from "../../shared/types";

export class TaskFetch extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Get a single Task by slug",
		request: {
			params: TaskSlugParams,
		},
		responses: {
			"200": {
				description: "Returns a single task if found",
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
		const { taskSlug } = (await this.getValidatedData<typeof this.schema>()).params;

		const task = await c.get("services").tasks.get(taskSlug);

		return success({ task });
	}
}
