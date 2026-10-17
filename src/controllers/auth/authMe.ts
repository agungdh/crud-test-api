import { OpenAPIRoute } from "chanfana";
import { UserSchema } from "../../models/user";
import { errorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class AuthMe extends OpenAPIRoute {
	schema = {
		tags: ["Auth"],
		summary: "Get the authenticated user",
		security: [{ bearerAuth: [] }],
		responses: {
			"200": {
				description: "Returns the authenticated user",
				content: {
					"application/json": {
						schema: UserSchema,
					},
				},
			},
			...errorResponse(401, "Missing or invalid token"),
		},
	};

	async handle(c: AppContext) {
		const user = await c.get("services").auth.me(c.get("user").id);

		return c.json(user);
	}
}
