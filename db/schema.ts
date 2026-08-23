import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const worldEventLogs = sqliteTable("world_event_logs", {
  worldId: text("world_id").primaryKey(),
  version: integer("version").notNull(),
  eventsJson: text("events_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
