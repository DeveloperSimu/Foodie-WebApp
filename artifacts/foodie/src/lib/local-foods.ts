import type { FoodItem } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_foods";

export function getLocalFoods(cafeId?: number): FoodItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const foods = Array.isArray(value) ? (value as FoodItem[]) : [];
    return cafeId === undefined ? foods : foods.filter((food) => food.cafeId === cafeId);
  } catch {
    return [];
  }
}

export function createLocalFood(
  data: Pick<FoodItem, "name" | "description" | "price" | "category" | "available"> & { imageUrl?: string },
  cafeId: number,
  cafeName: string,
): FoodItem {
  const food: FoodItem = {
    ...data,
    id: Date.now(),
    imageUrl: data.imageUrl || null,
    cafeId,
    cafeName,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([food, ...getLocalFoods()]));
  return food;
}

export function updateLocalFood(id: number, updates: Partial<FoodItem>): boolean {
  const foods = getLocalFoods();
  if (!foods.some((food) => food.id === id)) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(foods.map((food) => food.id === id ? { ...food, ...updates } : food)));
  return true;
}

export function deleteLocalFood(id: number): boolean {
  const foods = getLocalFoods();
  const next = foods.filter((food) => food.id !== id);
  if (next.length === foods.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}
