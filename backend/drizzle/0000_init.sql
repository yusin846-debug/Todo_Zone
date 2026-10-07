CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`due_date` text,
	`status` text NOT NULL,
	`position` integer NOT NULL,
	`project_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "cards_title_length" CHECK(length(title) BETWEEN 1 AND 100),
	CONSTRAINT "cards_memo_length" CHECK(length(memo) <= 2000),
	CONSTRAINT "cards_status" CHECK(status IN ('todo', 'doing', 'done')),
	CONSTRAINT "cards_position" CHECK(position >= 0),
	CONSTRAINT "cards_due_date" CHECK(due_date IS NULL OR due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `cards_status_position` ON `cards` (`status`,`position`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`color` text NOT NULL,
	`icon` text DEFAULT 'folder' NOT NULL,
	`is_inbox` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "projects_is_inbox_bool" CHECK(is_inbox IN (0, 1)),
	CONSTRAINT "projects_color" CHECK(color IN ('inbox', 'mist', 'gold', 'sage', 'salmon')),
	CONSTRAINT "projects_inbox_color" CHECK((is_inbox = 1 AND color = 'inbox') OR (is_inbox = 0 AND color <> 'inbox')),
	CONSTRAINT "projects_inbox_icon" CHECK((is_inbox = 1 AND icon = 'inbox') OR (is_inbox = 0 AND icon <> 'inbox'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_key_unique` ON `projects` (`name_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_one_inbox` ON `projects` (is_inbox) WHERE is_inbox = 1;