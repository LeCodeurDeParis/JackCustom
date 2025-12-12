import { integer, pgTable } from "drizzle-orm/pg-core";

export const playerStats = pgTable("player_stats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  player_id: integer("player_id").notNull(),
  games_played: integer("games_played").notNull().default(0),
  games_won: integer("games_won").notNull().default(0),
  games_lost: integer("games_lost").notNull().default(0),
});
