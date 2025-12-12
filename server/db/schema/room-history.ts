import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const roomHistory = pgTable("room_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  room_code: integer("room_id").notNull(),
  host_id: integer("host_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  finished_at: timestamp("finished_at").notNull(),
  config: jsonb("config").notNull(),
  result: jsonb("result").notNull(),
});
