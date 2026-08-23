CREATE TABLE `world_event_logs` (
	`world_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`events_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
