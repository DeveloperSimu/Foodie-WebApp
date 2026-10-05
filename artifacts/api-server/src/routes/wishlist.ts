import { Router, type IRouter } from "express";
import { db, wishlistItemsTable, foodItemsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const items = await db
    .select({ wi: wishlistItemsTable, fi: foodItemsTable, cafe: usersTable })
    .from(wishlistItemsTable)
    .leftJoin(foodItemsTable, eq(wishlistItemsTable.foodItemId, foodItemsTable.id))
    .leftJoin(usersTable, eq(foodItemsTable.cafeId, usersTable.id))
    .where(eq(wishlistItemsTable.userId, req.user!.id))
    .orderBy(desc(wishlistItemsTable.createdAt));

  res.json(items.map(({ wi, fi, cafe }) => ({
    id: wi.id,
    userId: wi.userId,
    foodItemId: wi.foodItemId,
    foodItem: fi ? {
      id: fi.id,
      name: fi.name,
      description: fi.description,
      price: Number(fi.price),
      imageUrl: fi.imageUrl ?? null,
      category: fi.category,
      cafeId: fi.cafeId,
      cafeName: cafe?.name ?? null,
      available: fi.available,
      rating: Number(fi.rating),
      reviewCount: fi.reviewCount,
      createdAt: fi.createdAt,
    } : null,
    createdAt: wi.createdAt,
  })));
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.userId, req.user!.id), eq(wishlistItemsTable.foodItemId, parsed.data.foodItemId)));

  if (existing) {
    res.status(409).json({ error: "Already in wishlist" });
    return;
  }

  const [wi] = await db.insert(wishlistItemsTable).values({
    userId: req.user!.id,
    foodItemId: parsed.data.foodItemId,
  }).returning();

  const [row] = await db
    .select({ fi: foodItemsTable, cafe: usersTable })
    .from(foodItemsTable)
    .leftJoin(usersTable, eq(foodItemsTable.cafeId, usersTable.id))
    .where(eq(foodItemsTable.id, wi.foodItemId));

  const fi = row?.fi;
  const cafe = row?.cafe;

  res.status(201).json({
    id: wi.id,
    userId: wi.userId,
    foodItemId: wi.foodItemId,
    foodItem: fi ? {
      id: fi.id,
      name: fi.name,
      description: fi.description,
      price: Number(fi.price),
      imageUrl: fi.imageUrl ?? null,
      category: fi.category,
      cafeId: fi.cafeId,
      cafeName: cafe?.name ?? null,
      available: fi.available,
      rating: Number(fi.rating),
      reviewCount: fi.reviewCount,
      createdAt: fi.createdAt,
    } : null,
    createdAt: wi.createdAt,
  });
});

router.delete("/wishlist/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFromWishlistParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.id, params.data.id), eq(wishlistItemsTable.userId, req.user!.id)));

  if (!existing) {
    res.status(404).json({ error: "Wishlist item not found" });
    return;
  }

  await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
