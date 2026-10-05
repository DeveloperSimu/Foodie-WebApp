import type { Short } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_shorts";

export function getLocalShorts(): Short[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? (value as Short[]) : [];
  } catch {
    return [];
  }
}

export function createLocalShort(
  title: string,
  description: string | undefined,
  videoUrl: string,
  thumbnailUrl: string | undefined,
  authorId: number,
  authorName: string,
  authorRole: string,
): Short {
  const short: Short = {
    id: Date.now(),
    title,
    description: description || null,
    videoUrl,
    thumbnailUrl: thumbnailUrl || null,
    authorId,
    authorName,
    authorRole,
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([short, ...getLocalShorts()]));
  return short;
}

export function deleteLocalShort(shortId: number): boolean {
  const shorts = getLocalShorts();
  const next = shorts.filter((short) => short.id !== shortId);
  if (next.length === shorts.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function updateLocalShortLikes(shortId: number, likes: number): boolean {
  const shorts = getLocalShorts();
  if (!shorts.some((short) => short.id === shortId)) return false;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(shorts.map((short) => short.id === shortId ? { ...short, likes: Math.max(0, likes) } : short)),
  );
  return true;
}

export function toggleLocalShortLike(shortId: number, liked: boolean): boolean {
  const short = getLocalShorts().find((item) => item.id === shortId);
  return short ? updateLocalShortLikes(shortId, short.likes + (liked ? 1 : -1)) : false;
}

export function updateLocalShort(shortId: number, updates: Partial<Short>): boolean {
  const shorts = getLocalShorts();
  if (!shorts.some((short) => short.id === shortId)) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shorts.map((short) => short.id === shortId ? { ...short, ...updates } : short)));
  return true;
}
