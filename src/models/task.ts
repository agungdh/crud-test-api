import { z } from "zod";

export const TaskSchema = z.object({
	name: z.string().openapi({ example: "lorem" }),
	slug: z.string(),
	description: z.string().optional(),
	completed: z.boolean().default(false),
	due_date: z.iso.date(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskBody = TaskSchema;

export const TaskSlugParams = z.object({
	taskSlug: z.string().describe("Task slug"),
});

export const ListTasksQuery = z.object({
	page: z.number().default(0).describe("Page number"),
	isCompleted: z.boolean().optional().describe("Filter by completed flag"),
});
