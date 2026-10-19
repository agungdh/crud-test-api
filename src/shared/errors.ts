import { ApiException, MultiException } from "chanfana";
import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { ZodError } from "zod";
import type { AppEnv } from "./types";

/**
 * All error responses share the same shape: `{ message }`. The HTTP status code
 * is the only error code — no numeric application codes.
 */
export const ErrorSchema = z.object({
	message: z.string(),
});

export const ErrorResponseSchema = ErrorSchema;

export const errorResponse = (status: number, description: string) => ({
	[status]: {
		description,
		content: {
			"application/json": {
				schema: ErrorResponseSchema,
			},
		},
	},
});

export const validationErrorResponse = (description = "Input validation error") =>
	errorResponse(400, description);

/** Flatten chanfana's exception tree into a single human-readable message. */
const messageOf = (err: ApiException): string => {
	if (err instanceof MultiException) {
		return [...new Set(err.errors.map(messageOf))].join(", ");
	}

	return err.message || err.default_message;
};

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
	if (err instanceof ZodError) {
		const messages = [...new Set(err.issues.map((issue) => issue.message))];
		return c.json({ message: messages.join(", ") }, 400);
	}

	if (err instanceof ApiException) {
		return c.json({ message: messageOf(err) }, err.status as ContentfulStatusCode);
	}

	if (err instanceof HTTPException) {
		return c.json({ message: err.message }, err.status);
	}

	console.error("Unhandled error:", err);

	return c.json({ message: "Internal Server Error" }, 500);
};

export const handleNotFound: NotFoundHandler<AppEnv> = (c) =>
	c.json({ message: "Not Found" }, 404);
