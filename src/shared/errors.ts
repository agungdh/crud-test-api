import { ApiException, InputValidationException, MultiException } from "chanfana";
import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { ZodError } from "zod";
import type { AppEnv } from "./types";

export const ErrorSchema = z.object({
	code: z.number(),
	message: z.string(),
});

export const ValidationErrorSchema = ErrorSchema.extend({
	path: z.array(z.string()),
});

export const ErrorResponseSchema = z.object({
	error: ErrorSchema,
});

export const ValidationErrorResponseSchema = z.object({
	errors: ValidationErrorSchema.array(),
});

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

export const validationErrorResponse = (description = "Input validation error") => ({
	"400": {
		description,
		content: {
			"application/json": {
				schema: ValidationErrorResponseSchema,
			},
		},
	},
});

const isValidationError = (err: unknown): boolean =>
	err instanceof ZodError ||
	err instanceof InputValidationException ||
	(err instanceof MultiException && err.errors.every((e) => e instanceof InputValidationException));

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
	if (err instanceof ZodError) {
		return c.json(
			{
				errors: err.issues.map((issue) => ({
					code: 7001,
					message: issue.message,
					path: issue.path.map(String),
				})),
			},
			400,
		);
	}

	if (err instanceof ApiException) {
		const errors = err.buildResponse();
		const status = err.status as ContentfulStatusCode;

		if (isValidationError(err)) {
			return c.json({ errors }, status);
		}

		return c.json({ error: errors[0] }, status);
	}

	if (err instanceof HTTPException) {
		return c.json({ error: { code: 7000, message: err.message } }, err.status);
	}

	console.error("Unhandled error:", err);

	return c.json({ error: { code: 7009, message: "Internal Server Error" } }, 500);
};

export const handleNotFound: NotFoundHandler<AppEnv> = (c) =>
	c.json({ error: { code: 7002, message: "Not Found" } }, 404);
