import type { Review } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_reviews";

export function getLocalReviews(ideaId?: number): Review[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const reviews = Array.isArray(value) ? (value as Review[]) : [];
    return ideaId === undefined ? reviews : reviews.filter((review) => review.ideaId === ideaId);
  } catch {
    return [];
  }
}

export function createLocalReview(
  ideaId: number,
  authorId: number,
  authorName: string,
  comment: string,
  rating: number,
): Review {
  const review: Review = {
    id: Date.now(),
    ideaId,
    authorId,
    authorName,
    comment,
    rating,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([review, ...getLocalReviews()]));
  return review;
}

export function deleteLocalReview(reviewId: number): boolean {
  const reviews = getLocalReviews();
  const next = reviews.filter((review) => review.id !== reviewId);
  if (next.length === reviews.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function updateLocalReview(reviewId: number, updates: Partial<Review>): boolean {
  const reviews = getLocalReviews();
  if (!reviews.some((review) => review.id === reviewId)) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews.map((review) => review.id === reviewId ? { ...review, ...updates } : review)));
  return true;
}
