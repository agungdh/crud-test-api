import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit only *generates* SQL here; migrations are applied with
 * `wrangler d1 migrations apply` (see the Makefile / npm scripts), which is why
 * `out` points at Wrangler's default `migrations` directory.
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./migrations",
});
