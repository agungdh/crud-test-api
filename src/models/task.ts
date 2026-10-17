import { z } from "zod";

export const TaskSchema = z.object({
	id: z.number().describe("Task id"),
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	due_date: z.iso.date(),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskInput = Omit<Task, "id">;

export const CreateTaskBody = TaskSchema.omit({ id: true });

export const TaskIdParams = z.object({
	id: z.coerce.number().int().positive().describe("Task id"),
});

export const ListTasksQuery = z.object({
	page: z.number().default(0).describe("Page number"),
	isCompleted: z.boolean().optional().describe("Filter by completed flag"),
});
