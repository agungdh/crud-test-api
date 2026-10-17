import type { User, UserWithPassword } from "../models/user";

export class UserRepository {
	constructor(private readonly db: D1Database) {}

	async findByEmail(email: string): Promise<UserWithPassword | null> {
		const row = await this.db
			.prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?")
			.bind(email)
			.first<Record<string, unknown>>();

		return row ? { ...toUser(row), password_hash: row.password_hash as string } : null;
	}

	async findById(id: number): Promise<User | null> {
		const row = await this.db
			.prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
			.bind(id)
			.first<Record<string, unknown>>();

		return row ? toUser(row) : null;
	}
}

function toUser(row: Record<string, unknown>): User {
	return {
		id: Number(row.id),
		email: row.email as string,
		name: row.name as string,
		created_at: row.created_at as string,
	};
}
