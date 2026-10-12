CREATE TABLE IF NOT EXISTS `agent_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `agent_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`approval_hash` text,
	`result` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `agent_conversation_version` ON `agent_turns` (`conversation_id`,`version`);
