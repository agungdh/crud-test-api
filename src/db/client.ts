import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Build a Drizzle client bound to the D1 binding (one per request). */
export function createDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
