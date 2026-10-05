import { pgTable, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { foodItemsTable } from "./food-items";

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  foodItemId: integer("food_item_id").notNull().references(() => foodItemsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.foodItemId)]);

export const insertWishlistItemSchema = createInsertSchema(wishlistItemsTable).omit({ id: true, createdAt: true });
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
