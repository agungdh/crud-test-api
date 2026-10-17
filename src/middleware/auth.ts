import { UnauthorizedException } from "chanfana";
import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import type { AppEnv } from "../shared/types";

const BEARER_PREFIX = "Bearer ";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const header = c.req.header("Authorization");

	if (!header?.startsWith(BEARER_PREFIX)) {
		throw new UnauthorizedException("Missing or malformed Authorization header");
	}

	const token = header.slice(BEARER_PREFIX.length).trim();

	try {
		const payload = await verify(token, c.env.AUTH_SECRET, "HS256");

		c.set("user", {
			id: Number(payload.sub),
			email: String(payload.email),
		});
	} catch {
		throw new UnauthorizedException("Invalid or expired token");
	}

	await next();
};
