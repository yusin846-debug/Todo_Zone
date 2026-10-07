-- 수정: drizzle-kit이 아직 없는 area_id를 SELECT 해서 NULL로 고쳤다 (0002와 같은 문제).
CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "areas_color" CHECK(color IN ('mist', 'gold', 'sage', 'salmon'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `areas_name_key_unique` ON `areas` (`name_key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`color` text NOT NULL,
	`area_id` text,
	`icon` text DEFAULT 'folder' NOT NULL,
	`is_inbox` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "projects_is_inbox_bool" CHECK(is_inbox IN (0, 1)),
	CONSTRAINT "projects_inbox_no_area" CHECK(is_inbox = 0 OR area_id IS NULL),
	CONSTRAINT "projects_inbox_icon" CHECK((is_inbox = 1 AND icon = 'inbox') OR (is_inbox = 0 AND icon <> 'inbox'))
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "name", "name_key", "color", "area_id", "icon", "is_inbox", "created_at", "updated_at") SELECT "id", "name", "name_key", "color", NULL, "icon", "is_inbox", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_key_unique` ON `projects` (`name_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_one_inbox` ON `projects` (`is_inbox`) WHERE is_inbox = 1;--> statement-breakpoint
-- D-084: 기본 Area 4개. 색은 D-086 (Business gold, Career mist, Ventures salmon, Life sage)
INSERT INTO `areas` (`id`, `name`, `name_key`, `color`, `created_at`, `updated_at`) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'Business', 'business', 'gold', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+0.001 seconds'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('00000000-0000-4000-8000-0000000000a2', 'Career', 'career', 'mist', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+0.002 seconds'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('00000000-0000-4000-8000-0000000000a3', 'Ventures', 'ventures', 'salmon', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+0.003 seconds'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('00000000-0000-4000-8000-0000000000a4', 'Life', 'life', 'sage', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+0.004 seconds'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
