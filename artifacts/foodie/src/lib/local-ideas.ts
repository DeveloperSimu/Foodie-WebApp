import type { Idea } from "@workspace/api-client-react";

const STORAGE_KEY = "foodie_local_ideas";

export function getLocalIdeas(): Idea[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? (value as Idea[]) : [];
  } catch {
    return [];
  }
}

export function createLocalIdea(
  title: string,
  content: string,
  imageUrl: string | undefined,
  tags: string[],
  authorId: number,
  authorName: string,
  authorRole: string,
): Idea {
  const idea: Idea = {
    id: Date.now(),
    title,
    content,
    imageUrl: imageUrl || null,
    authorId,
    authorName,
    authorRole,
    likesCount: 0,
    reviewCount: 0,
    tags,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([idea, ...getLocalIdeas()]));
  return idea;
}

export function deleteLocalIdea(ideaId: number): boolean {
  const ideas = getLocalIdeas();
  const next = ideas.filter((idea) => idea.id !== ideaId);
  if (next.length === ideas.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function updateLocalIdeaLikes(ideaId: number, likesCount: number): boolean {
  const ideas = getLocalIdeas();
  if (!ideas.some((idea) => idea.id === ideaId)) return false;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(ideas.map((idea) => idea.id === ideaId ? { ...idea, likesCount: Math.max(0, likesCount) } : idea)),
  );
  return true;
}

export function toggleLocalIdeaLike(ideaId: number, liked: boolean): boolean {
  const idea = getLocalIdeas().find((item) => item.id === ideaId);
  return idea ? updateLocalIdeaLikes(ideaId, idea.likesCount + (liked ? 1 : -1)) : false;
}

export function updateLocalIdea(ideaId: number, updates: Partial<Idea>): boolean {
  const ideas = getLocalIdeas();
  if (!ideas.some((idea) => idea.id === ideaId)) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas.map((idea) => idea.id === ideaId ? { ...idea, ...updates } : idea)));
  return true;
}
