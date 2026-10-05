import { Router, type IRouter } from "express";
import { db, foodItemsTable, usersTable } from "@workspace/db";
import { eq, ilike, desc, and } from "drizzle-orm";
import {
  ListFoodItemsQueryParams,
  CreateFoodItemBody,
  UpdateFoodItemBody,
  GetFoodItemParams,
  UpdateFoodItemParams,
  DeleteFoodItemParams,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function formatItem(item: typeof foodItemsTable.$inferSelect, cafeName: string | null) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl ?? null,
    category: item.category,
    cafeId: item.cafeId,
    cafeName: cafeName ?? null,
    available: item.available,
    rating: Number(item.rating),
    reviewCount: item.reviewCount,
    createdAt: item.createdAt,
  };
}

router.get("/food-items/trending", async (_req, res): Promise<void> => {
  const items = await db
    .select({ item: foodItemsTable, cafe: usersTable })
    .from(foodItemsTable)
    .leftJoin(usersTable, eq(foodItemsTable.cafeId, usersTable.id))
    .where(eq(foodItemsTable.available, true))
    .orderBy(desc(foodItemsTable.reviewCount), desc(foodItemsTable.rating))
    .limit(8);

  res.json(items.map(({ item, cafe }) => formatItem(item, cafe?.name ?? null)));
});

router.get("/food-items", optionalAuth, async (req, res): Promise<void> => {
  const params = ListFoodItemsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, cafeId, search } = params.data;
  const conditions = [];

  if (category) conditions.push(eq(foodItemsTable.category, category));
  if (cafeId) conditions.push(eq(foodItemsTable.cafeId, cafeId));
  if (search) conditions.push(ilike(foodItemsTable.name, `%${search}%`));

  const items = await db
    .select({ item: foodItemsTable, cafe: usersTable })
    .from(foodItemsTable)
    .leftJoin(usersTable, eq(foodItemsTable.cafeId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(foodItemsTable.createdAt));

  res.json(items.map(({ item, cafe }) => formatItem(item, cafe?.name ?? null)));
});

router.post("/food-items", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "cafe") {
    res.status(403).json({ error: "Cafe account required" });
    return;
  }

  const parsed = CreateFoodItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, price, imageUrl, category, available } = parsed.data;

  const [item] = await db.insert(foodItemsTable).values({
    name,
    description,
    price: String(price),
    imageUrl: imageUrl ?? null,
    category,
    available: available ?? true,
    cafeId: req.user!.id,
  }).returning();

  const [cafe] = await db.select().from(usersTable).where(eq(usersTable.id, item.cafeId));
  res.status(201).json(formatItem(item, cafe?.name ?? null));
});

router.get("/food-items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFoodItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ item: foodItemsTable, cafe: usersTable })
    .from(foodItemsTable)
    .leftJoin(usersTable, eq(foodItemsTable.cafeId, usersTable.id))
    .where(eq(foodItemsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }

  res.json(formatItem(row.item, row.cafe?.name ?? null));
});

router.patch("/food-items/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "cafe") {
    res.status(403).json({ error: "Cafe account required" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateFoodItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateFoodItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(foodItemsTable).where(eq(foodItemsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }
  if (existing.cafeId !== req.user!.id) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updateData: Partial<typeof foodItemsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.available !== undefined) updateData.available = parsed.data.available;

  const [updated] = await db.update(foodItemsTable).set(updateData).where(eq(foodItemsTable.id, params.data.id)).returning();
  const [cafe] = await db.select().from(usersTable).where(eq(usersTable.id, updated.cafeId));
  res.json(formatItem(updated, cafe?.name ?? null));
});

router.delete("/food-items/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "cafe") {
    res.status(403).json({ error: "Cafe account required" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFoodItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(foodItemsTable).where(eq(foodItemsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }
  if (existing.cafeId !== req.user!.id) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(foodItemsTable).where(eq(foodItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
