import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./types";

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}

	console.error("Unhandled error:", err);

	return c.json(
		{
			success: false,
			errors: [{ code: 7000, message: "Internal Server Error" }],
			result: {},
		},
		500,
	);
};

export const handleNotFound: NotFoundHandler<AppEnv> = (c) =>
	c.json(
		{
			success: false,
			errors: [{ code: 7002, message: "Not Found" }],
			result: {},
		},
		404,
	);
