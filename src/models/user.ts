import { z } from "zod";

export const UserSchema = z.object({
	id: z.number().describe("User id"),
	email: z.email().describe("User email"),
	name: z.string().describe("User name"),
	created_at: z.string().describe("Creation timestamp"),
});

export type User = z.infer<typeof UserSchema>;

export type UserWithPassword = User & { password_hash: string };

export const LoginBody = z.object({
	email: z.email().describe("User email").openapi({ example: "admin@example.com" }),
	password: z.string().min(1).describe("User password"),
});

export const TokenResponse = z.object({
	token: z.string().describe("JWT access token"),
	token_type: z.literal("Bearer"),
	expires_in: z.number().describe("Token lifetime in seconds"),
});
