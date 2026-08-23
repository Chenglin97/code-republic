import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const worldEventLogs = sqliteTable("world_event_logs", {
  worldId: text("world_id").primaryKey(),
  version: integer("version").notNull(),
  eventsJson: text("events_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const a2aTraces = sqliteTable("a2a_traces", {
  traceId: text("trace_id").primaryKey(),
  worldId: text("world_id").notNull(),
  timestamp: text("timestamp").notNull(),
  recordJson: text("record_json").notNull(),
}, (table) => [
  index("idx_a2a_traces_world_timestamp").on(table.worldId, table.timestamp),
]);
