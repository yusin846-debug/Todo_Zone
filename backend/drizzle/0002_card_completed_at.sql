-- 수정: drizzle-kit이 아직 없는 completed_at 열을 SELECT 하도록 만들어서 고쳤다.
-- 이미 Done인 Card는 마지막 수정 시각을 완료 시각으로 쓴다 (D-072).
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`due_date` text,
	`status` text NOT NULL,
	`position` integer NOT NULL,
	`project_id` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "cards_title_length" CHECK(length(title) BETWEEN 1 AND 100),
	CONSTRAINT "cards_memo_length" CHECK(length(memo) <= 2000),
	CONSTRAINT "cards_status" CHECK(status IN ('todo', 'doing', 'done')),
	CONSTRAINT "cards_position" CHECK(position >= 0),
	CONSTRAINT "cards_completed_at" CHECK((status = 'done') = (completed_at IS NOT NULL)),
	CONSTRAINT "cards_due_date" CHECK(due_date IS NULL OR due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
INSERT INTO `__new_cards`("id", "title", "memo", "due_date", "status", "position", "project_id", "completed_at", "created_at", "updated_at") SELECT "id", "title", "memo", "due_date", "status", "position", "project_id", CASE WHEN "status" = 'done' THEN "updated_at" ELSE NULL END, "created_at", "updated_at" FROM `cards`;--> statement-breakpoint
DROP TABLE `cards`;--> statement-breakpoint
ALTER TABLE `__new_cards` RENAME TO `cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cards_status_position` ON `cards` (`status`,`position`);