import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { users, type UserRow } from "../db/schema";
import type { UserWithPassword } from "../models/user";
import { SoftDeleteRepository } from "./base.repository";

export class UserRepository extends SoftDeleteRepository<typeof users> {
	constructor(db: AppDatabase) {
		super(db, users);
	}

	findByEmail(email: string): Promise<UserWithPassword | null> {
		return this.findFirst(eq(users.email, email));
	}

	findById(id: number): Promise<UserRow | null> {
		return super.findById(id);
	}
}
