import { ConflictException, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { CreateTaskBody, TaskSchema } from "../../models/task";
import { success } from "../../shared/http";
import type { AppContext } from "../../shared/types";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Create a new Task",
		request: {
			body: {
				content: {
					"application/json": {
						schema: CreateTaskBody,
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created task",
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
			...ConflictException.schema(),
		},
	};

	async handle(c: AppContext) {
		const taskToCreate = (await this.getValidatedData<typeof this.schema>()).body;

		const task = await c.get("services").tasks.create(taskToCreate);

		return c.json(success({ task }), 201);
	}
}
