import { OpenAPIRoute } from "chanfana";
import { LoginBody, TokenResponse } from "../../models/user";
import { errorResponse, validationErrorResponse } from "../../shared/errors";
import type { AppContext } from "../../shared/types";

export class AuthLogin extends OpenAPIRoute {
	schema = {
		tags: ["Auth"],
		summary: "Authenticate with email and password",
		request: {
			body: {
				content: {
					"application/json": {
						schema: LoginBody,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns an access token",
				content: {
					"application/json": {
						schema: TokenResponse,
					},
				},
			},
			...validationErrorResponse(),
			...errorResponse(401, "Invalid credentials"),
		},
	};

	async handle(c: AppContext) {
		const { email, password } = (await this.getValidatedData<typeof this.schema>()).body;

		return c.json(await c.get("services").auth.login(email, password));
	}
}
