import { ApiException, InputValidationException, MultiException } from "chanfana";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { ZodError } from "zod";
import type { AppEnv } from "./types";

/**
 * Non-validation errors share the shape `{ message }`. The HTTP status code is
 * the only error code — no numeric application codes.
 */
export const ErrorSchema = z.object({
	message: z.string(),
});

export const ErrorResponseSchema = ErrorSchema;

/**
 * Validation errors additionally carry a field-keyed error bag:
 * `{ message, errors: { password: [{ message }] } }`.
 */
export const FieldErrorSchema = z.object({
	message: z.string(),
});

export const ValidationErrorSchema = z.object({
	message: z.string(),
	errors: z.record(z.string(), z.array(FieldErrorSchema)),
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
	400: {
		description,
		content: {
			"application/json": {
				schema: ValidationErrorSchema,
			},
		},
	},
});

/** Flatten chanfana's exception tree into a single human-readable message. */
const messageOf = (err: ApiException): string => {
	if (err instanceof MultiException) {
		return [...new Set(err.errors.map(messageOf))].join(", ");
	}

	return err.message || err.default_message;
};

type IssuePath = readonly PropertyKey[];

type ValidationErrorBag = Record<string, { message: string }[]>;

/** Request locations chanfana prefixes to every validation issue path. */
const REQUEST_LOCATIONS = new Set(["body", "query", "params", "headers"]);

/** `["body", "address", "city"]` -> `address.city`; `["body"]` -> `body`. */
const fieldKeyOf = (path: IssuePath): string => {
	const segments = path.map(String);
	const first = segments[0];
	const fieldPath =
		first !== undefined && REQUEST_LOCATIONS.has(first) ? segments.slice(1) : segments;

	return fieldPath.length > 0 ? fieldPath.join(".") : (first ?? "_root");
};

const addIssue = (bag: ValidationErrorBag, path: IssuePath, message: string) => {
	const key = fieldKeyOf(path);
	const fieldErrors = (bag[key] ??= []);

	if (!fieldErrors.some((error) => error.message === message)) {
		fieldErrors.push({ message });
	}
};

const bagFromZodIssues = (issues: ZodError["issues"]): ValidationErrorBag => {
	const bag: ValidationErrorBag = {};

	for (const issue of issues) {
		addIssue(bag, issue.path, issue.message);
	}

	return bag;
};

/** Read an `InputValidationException` path at runtime (chanfana types it as `null`). */
const issuePathOf = (err: ApiException): IssuePath => {
	const path = (err as unknown as { path?: unknown }).path;

	if (!Array.isArray(path)) {
		return [];
	}

	return path.map((segment) => (typeof segment === "number" ? segment : String(segment)));
};

/** Build a field-keyed bag when every exception is an input validation error. */
const bagFromApiException = (err: ApiException): ValidationErrorBag | null => {
	if (err instanceof InputValidationException) {
		const bag: ValidationErrorBag = {};
		addIssue(bag, issuePathOf(err), err.message);
		return bag;
	}

	if (
		err instanceof MultiException &&
		err.errors.length > 0 &&
		err.errors.every((error) => error instanceof InputValidationException)
	) {
		const bag: ValidationErrorBag = {};

		for (const error of err.errors) {
			addIssue(bag, issuePathOf(error), error.message);
		}

		return bag;
	}

	return null;
};

const validationResponse = (c: Context<AppEnv>, errors: ValidationErrorBag) =>
	c.json({ message: "Validation failed", errors }, 400);

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
	if (err instanceof ZodError) {
		return validationResponse(c, bagFromZodIssues(err.issues));
	}

	if (err instanceof ApiException) {
		const errors = bagFromApiException(err);

		if (errors) {
			return validationResponse(c, errors);
		}

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
