import { z } from "zod";

export const TaskSchema = z.object({
	id: z.number().describe("Task id"),
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().nullable().optional(),
	completed: z.boolean().default(false),
	due_date: z.number().int().describe("Due date (epoch seconds)"),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskBody = TaskSchema.omit({ id: true });
export type TaskInput = z.infer<typeof CreateTaskBody>;

/**
 * PUT replaces the whole task, so every mutable field is required. Send
 * `description: null` to clear it; nothing is inferred from omission.
 */
export const UpdateTaskBody = z.object({
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().nullable(),
	completed: z.boolean(),
	due_date: z.number().int().describe("Due date (epoch seconds)"),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskBody>;

export const TaskIdParams = z.object({
	id: z.coerce.number().int().positive().describe("Task id"),
});

export const ListTasksQuery = z.object({
	page: z.number().default(0).describe("Page number"),
	isCompleted: z.boolean().optional().describe("Filter by completed flag"),
});
