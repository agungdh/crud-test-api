CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`due_date` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`deleted_by` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_user_slug_unique` ON `tasks` (`user_id`,`slug`) WHERE "tasks"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `tasks_user_id_idx` ON `tasks` (`user_id`);--> statement-breakpoint
CREATE INDEX `tasks_deleted_at_idx` ON `tasks` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`deleted_by` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`) WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `users_deleted_at_idx` ON `users` (`deleted_at`);