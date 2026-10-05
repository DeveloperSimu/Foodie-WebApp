import type { FoodItem, Order } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_orders";

export function getLocalOrders(): Order[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? (value as Order[]) : [];
  } catch {
    return [];
  }
}

export function createLocalOrder(
  food: FoodItem,
  quantity: number,
  deliveryAddress: string,
  notes: string,
): Order {
  const now = new Date().toISOString();
  const order: Order = {
    id: Date.now(),
    userId: 0,
    userName: null,
    status: "pending",
    total: Number((food.price * quantity).toFixed(2)),
    deliveryAddress,
    notes,
    items: [{
      id: Date.now(),
      foodItemId: food.id,
      foodItemName: food.name,
      foodItemImageUrl: food.imageUrl,
      quantity,
      price: food.price,
    }],
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...getLocalOrders()]));
  return order;
}

export function updateLocalOrderStatus(orderId: number, status: Order["status"]): boolean {
  const orders = getLocalOrders();
  const exists = orders.some((order) => order.id === orderId);
  if (!exists) return false;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders.map((order) => (
      order.id === orderId
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ))),
  );
  return true;
}

export function deleteLocalOrder(orderId: number): boolean {
  const orders = getLocalOrders();
  const next = orders.filter((order) => order.id !== orderId);
  if (next.length === orders.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}
