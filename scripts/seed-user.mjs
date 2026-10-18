#!/usr/bin/env node
// Seeds (or updates) a user in the D1 database.
//
// Usage:
//   npm run seed:user -- --email admin@example.com --name Admin --password secret123
//   npm run seed:user -- --email admin@example.com --name Admin --password secret123 --remote
//
// The hashing parameters below MUST stay in sync with src/shared/password.ts.

import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";

const ITERATIONS = 10_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const DB_NAME = "crud-test-api-db";

const subtle = globalThis.crypto?.subtle ?? webcrypto.subtle;

function parseArgs(argv) {
	const args = { remote: false, db: DB_NAME };

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];

		if (arg === "--remote") {
			args.remote = true;
		} else if (arg === "--local") {
			args.remote = false;
		} else if (arg === "--email" || arg === "--name" || arg === "--password" || arg === "--db") {
			const value = argv[++i];

			if (value === undefined) {
				throw new Error(`Missing value for ${arg}`);
			}

			args[arg.slice(2)] = value;
		} else if (arg === "--help" || arg === "-h") {
			args.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return args;
}

function toBase64(bytes) {
	return Buffer.from(bytes).toString("base64");
}

async function hashPassword(password) {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const key = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, KEY_BYTES * 8);

	return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

function quote(value) {
	return `'${String(value).replace(/'/g, "''")}'`;
}

const help = `Usage: npm run seed:user -- --email <email> --name <name> --password <password> [--remote] [--db <name>]`;

async function main() {
	const args = parseArgs(process.argv.slice(2));

	if (args.help) {
		console.log(help);
		return;
	}

	for (const field of ["email", "name", "password"]) {
		if (!args[field]) {
			throw new Error(`Missing required argument: --${field}\n\n${help}`);
		}
	}

	const passwordHash = await hashPassword(args.password);
	const now = Date.now();

	// `email` is a *partial* unique index (`WHERE deleted_at IS NULL`), so the
	// upsert conflict target must repeat that predicate.
	const sql = [
		"INSERT INTO users (email, name, password_hash, created_at, updated_at)",
		`VALUES (${quote(args.email)}, ${quote(args.name)}, ${quote(passwordHash)}, ${now}, ${now})`,
		"ON CONFLICT(email) WHERE deleted_at IS NULL DO UPDATE SET",
		"name = excluded.name, password_hash = excluded.password_hash, updated_at = excluded.updated_at;",
	].join(" ");

	const wranglerArgs = ["wrangler", "d1", "execute", args.db, args.remote ? "--remote" : "--local", "--command", sql];

	console.log(`Seeding user ${args.email} (${args.remote ? "remote" : "local"})...`);

	const result = spawnSync("npx", wranglerArgs, { stdio: "inherit" });

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	console.log("Done.");
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
