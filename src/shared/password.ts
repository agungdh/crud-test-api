const ALGORITHM = "PBKDF2";
const DIGEST = "SHA-256";
const KEY_BYTES = 32;
const SALT_BYTES = 16;

/**
 * PBKDF2-SHA256 iteration count.
 *
 * Tuned for the Workers Free plan CPU budget (10 ms per request). Benchmarking
 * `crypto.subtle.deriveBits` shows ~1.3 ms at 10k iterations, while 100k already
 * costs ~12 ms and trips Error 1102. The login request also pays for the JWT
 * signing, JSON parsing and the D1 query, so we stay well under the limit.
 *
 * Raise this if the Worker runs on the Paid plan (CPU budget 30s), then re-seed
 * the users so their stored hashes adopt the new cost.
 */
const ITERATIONS = 10_000;

const encoder = new TextEncoder();

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey("raw", encoder.encode(password), ALGORITHM, false, ["deriveBits"]);

	const bits = await crypto.subtle.deriveBits({ name: ALGORITHM, hash: DIGEST, salt, iterations }, key, KEY_BYTES * 8);

	return new Uint8Array(bits);
}

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a[i]! ^ b[i]!;
	}

	return diff === 0;
}

/** Returns a `pbkdf2$<iterations>$<saltB64>$<hashB64>` string. */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await derive(password, salt, ITERATIONS);

	return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split("$");

	if (parts.length !== 4 || parts[0] !== "pbkdf2") {
		return false;
	}

	const iterations = Number(parts[1]);

	if (!Number.isInteger(iterations) || iterations <= 0) {
		return false;
	}

	let salt: Uint8Array;
	let expected: Uint8Array;

	try {
		salt = fromBase64(parts[2]!);
		expected = fromBase64(parts[3]!);
	} catch {
		return false;
	}

	const actual = await derive(password, salt, iterations);

	return timingSafeEqual(actual, expected);
}
