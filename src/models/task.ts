import { z } from "zod";
import { auditFields, auditOmit } from "./audit";

export const TaskSchema = z.object({
	id: z.number().describe("Task id"),
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().nullable().optional(),
	completed: z.boolean().default(false),
	due_date: z.number().int().describe("Due date (epoch seconds)"),
	...auditFields,
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskBody = TaskSchema.omit({ id: true, ...auditOmit });
export type TaskInput = z.infer<typeof CreateTaskBody>;

export const TaskIdParams = z.object({
	id: z.coerce.number().int().positive().describe("Task id"),
});

export const ListTasksQuery = z.object({
	page: z.number().default(0).describe("Page number"),
	isCompleted: z.boolean().optional().describe("Filter by completed flag"),
});
