import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requireAuth } from "./middleware/auth";
import { registerRoutes } from "./routes";
import { buildServices } from "./shared/container";
import { handleError, handleNotFound } from "./shared/errors";
import type { AppEnv } from "./shared/types";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
	c.set("services", buildServices(c.env));
	await next();
});

// Allow the SPA (served from a different origin) to call the API from the browser.
// Registered before the auth guard so CORS preflight (OPTIONS) is not rejected.
app.use(
	"/api/*",
	cors({
		origin: "*",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		maxAge: 600,
	}),
);

app.onError(handleError);
app.notFound(handleNotFound);

const openapi = fromHono(app, {
	docs_url: "/",
	passthroughErrors: true,
});

openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
});

// Every /api route requires a valid token, except for the login endpoint.
openapi.use("/api/*", async (c, next) => {
	if (c.req.method === "POST" && c.req.path === "/api/auth/login") {
		return next();
	}

	return requireAuth(c, next);
});

registerRoutes(openapi);

export default app;
