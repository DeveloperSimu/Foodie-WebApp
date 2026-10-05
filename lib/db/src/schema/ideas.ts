import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cookingIdeasTable = pgTable("cooking_ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  likesCount: integer("likes_count").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ideaReviewsTable = pgTable("idea_reviews", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").notNull().references(() => cookingIdeasTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCookingIdeaSchema = createInsertSchema(cookingIdeasTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIdeaReviewSchema = createInsertSchema(ideaReviewsTable).omit({ id: true, createdAt: true });
export type InsertCookingIdea = z.infer<typeof insertCookingIdeaSchema>;
export type InsertIdeaReview = z.infer<typeof insertIdeaReviewSchema>;
export type CookingIdea = typeof cookingIdeasTable.$inferSelect;
export type IdeaReview = typeof ideaReviewsTable.$inferSelect;
