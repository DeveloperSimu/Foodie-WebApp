import { Router, type IRouter } from "express";
import { db, foodItemsTable, ordersTable, usersTable, shortsTable, cookingIdeasTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [foodCount] = await db.select({ count: count() }).from(foodItemsTable);
  const [orderCount] = await db.select({ count: count() }).from(ordersTable);
  const [userCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user"));
  const [cafeCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "cafe"));
  const [shortCount] = await db.select({ count: count() }).from(shortsTable);
  const [ideaCount] = await db.select({ count: count() }).from(cookingIdeasTable);

  const categoryRows = await db
    .select({
      category: foodItemsTable.category,
      count: count(),
    })
    .from(foodItemsTable)
    .groupBy(foodItemsTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(6);

  res.json({
    totalFoodItems: foodCount?.count ?? 0,
    totalOrders: orderCount?.count ?? 0,
    totalUsers: userCount?.count ?? 0,
    totalCafes: cafeCount?.count ?? 0,
    totalShorts: shortCount?.count ?? 0,
    totalIdeas: ideaCount?.count ?? 0,
    popularCategories: categoryRows.map((r) => ({ category: r.category, count: r.count })),
  });
});

export default router;
