import type { FoodItem } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_wishlist";

export function getLocalWishlist(): FoodItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? (value as FoodItem[]) : [];
  } catch {
    return [];
  }
}

export function toggleLocalWishlist(food: FoodItem): boolean {
  const items = getLocalWishlist();
  const exists = items.some((item) => item.id === food.id);
  const next = exists ? items.filter((item) => item.id !== food.id) : [...items, food];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !exists;
}
