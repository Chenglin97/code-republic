CREATE TABLE `a2a_traces` (
	`trace_id` text PRIMARY KEY NOT NULL,
	`world_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`record_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_a2a_traces_world_timestamp` ON `a2a_traces` (`world_id`,`timestamp`);