import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, foodItemsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db
    .select({ oi: orderItemsTable, fi: foodItemsTable })
    .from(orderItemsTable)
    .leftJoin(foodItemsTable, eq(orderItemsTable.foodItemId, foodItemsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));

  return {
    id: order.id,
    userId: order.userId,
    userName: user?.name ?? null,
    status: order.status,
    total: Number(order.total),
    deliveryAddress: order.deliveryAddress ?? null,
    notes: order.notes ?? null,
    items: items.map(({ oi, fi }) => ({
      id: oi.id,
      foodItemId: oi.foodItemId,
      foodItemName: fi?.name ?? "Unknown item",
      foodItemImageUrl: fi?.imageUrl ?? null,
      quantity: oi.quantity,
      price: Number(oi.price),
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.user!.id))
    .orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.get("/orders/all", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "cafe") {
    res.status(403).json({ error: "Cafe account required" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, deliveryAddress, notes } = parsed.data;

  if (!items || items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }

  let total = 0;
  const enrichedItems: { foodItemId: number; quantity: number; price: number }[] = [];

  for (const item of items) {
    const [foodItem] = await db.select().from(foodItemsTable).where(eq(foodItemsTable.id, item.foodItemId));
    if (!foodItem) {
      res.status(400).json({ error: `Food item ${item.foodItemId} not found` });
      return;
    }
    const price = Number(foodItem.price) * item.quantity;
    total += price;
    enrichedItems.push({ foodItemId: item.foodItemId, quantity: item.quantity, price: Number(foodItem.price) });
  }

  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.id,
    total: String(total),
    deliveryAddress: deliveryAddress ?? null,
    notes: notes ?? null,
  }).returning();

  for (const item of enrichedItems) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      price: String(item.price),
    });
  }

  res.status(201).json(await buildOrderResponse(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.userId !== req.user!.id && req.user!.role !== "cafe") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.userId !== req.user!.id && req.user!.role !== "cafe") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const [updated] = await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, params.data.id)).returning();
  res.json(await buildOrderResponse(updated));
});

export default router;
