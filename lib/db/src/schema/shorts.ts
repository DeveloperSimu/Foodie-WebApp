import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shortsTable = pgTable("shorts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShortSchema = createInsertSchema(shortsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShort = z.infer<typeof insertShortSchema>;
export type Short = typeof shortsTable.$inferSelect;
