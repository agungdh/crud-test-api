import { UnauthorizedException } from "chanfana";
import { sign } from "hono/jwt";
import type { User } from "../models/user";
import type { UserRepository } from "../repositories/user.repository";
import { verifyPassword } from "../shared/password";

export interface AuthConfig {
	secret: string;
	ttlSeconds: number;
}

export interface LoginResult {
	token: string;
	expires_in: number;
}

/**
 * A valid PBKDF2 hash used when the email is unknown, so that password
 * verification costs the same (and takes the same time) for existing and
 * missing accounts, preventing user enumeration through timing.
 */
const DUMMY_HASH = "pbkdf2$10000$nB87eiJejQSxZsNAWhnngg==$kh1L8E8Gli7h5OOzI/tnqw+YHsE1FWaE4Ae38T1skV4=";

export class AuthService {
	constructor(
		private readonly repo: UserRepository,
		private readonly config: AuthConfig,
	) {}

	async login(email: string, password: string): Promise<LoginResult> {
		const user = await this.repo.findByEmail(email);
		const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

		if (!user || !valid) {
			throw new UnauthorizedException("Invalid email or password");
		}

		const now = Math.floor(Date.now() / 1000);
		const token = await sign(
			{ sub: String(user.id), email: user.email, iat: now, exp: now + this.config.ttlSeconds },
			this.config.secret,
			"HS256",
		);

		return { token, expires_in: this.config.ttlSeconds };
	}

	async me(userId: number): Promise<User> {
		const row = await this.repo.findById(userId);

		if (!row) {
			throw new UnauthorizedException("User no longer exists");
		}

		return {
			id: row.id,
			email: row.email,
			name: row.name,
		};
	}
}
