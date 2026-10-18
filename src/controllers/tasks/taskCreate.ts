import { OpenAPIRoute } from "chanfana";
import { CreateTaskBody } from "../../models/task";
import { errorResponse, validationErrorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Create a new Task",
		security: [{ bearerAuth: [] }],
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
				description: "Task created",
			},
			...validationErrorResponse(),
			...errorResponse(409, "Task already exists"),
		},
	};

	async handle(c: AppContext) {
		const taskToCreate = (await this.getValidatedData<typeof this.schema>()).body;

		await c.get("services").tasks.create(c.get("user").id, taskToCreate);

		return c.body(null, 201);
	}
}
