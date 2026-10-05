import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const foodItemsTable = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  cafeId: integer("cafe_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  available: boolean("available").notNull().default(true),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFoodItemSchema = createInsertSchema(foodItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItemsTable.$inferSelect;
