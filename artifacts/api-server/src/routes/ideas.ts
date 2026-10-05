import { Router, type IRouter } from "express";
import { db, cookingIdeasTable, ideaReviewsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateIdeaBody,
  GetIdeaParams,
  DeleteIdeaParams,
  LikeIdeaParams,
  ListIdeaReviewsParams,
  CreateIdeaReviewParams,
  CreateIdeaReviewBody,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function formatIdea(idea: typeof cookingIdeasTable.$inferSelect, author: typeof usersTable.$inferSelect | null) {
  return {
    id: idea.id,
    title: idea.title,
    content: idea.content,
    imageUrl: idea.imageUrl ?? null,
    authorId: idea.authorId,
    authorName: author?.name ?? "Unknown",
    authorRole: author?.role ?? "user",
    likesCount: idea.likesCount,
    reviewCount: idea.reviewCount,
    tags: idea.tags,
    createdAt: idea.createdAt,
  };
}

router.get("/ideas", optionalAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ idea: cookingIdeasTable, author: usersTable })
    .from(cookingIdeasTable)
    .leftJoin(usersTable, eq(cookingIdeasTable.authorId, usersTable.id))
    .orderBy(desc(cookingIdeasTable.createdAt));

  res.json(rows.map(({ idea, author }) => formatIdea(idea, author)));
});

router.post("/ideas", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, content, imageUrl, tags } = parsed.data;

  const [idea] = await db.insert(cookingIdeasTable).values({
    title,
    content,
    imageUrl: imageUrl ?? null,
    tags: tags ?? [],
    authorId: req.user!.id,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, idea.authorId));
  res.status(201).json(formatIdea(idea, author));
});

router.get("/ideas/:id", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetIdeaParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ idea: cookingIdeasTable, author: usersTable })
    .from(cookingIdeasTable)
    .leftJoin(usersTable, eq(cookingIdeasTable.authorId, usersTable.id))
    .where(eq(cookingIdeasTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Cooking idea not found" });
    return;
  }

  res.json(formatIdea(row.idea, row.author));
});

router.delete("/ideas/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteIdeaParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(cookingIdeasTable).where(eq(cookingIdeasTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Cooking idea not found" });
    return;
  }
  if (existing.authorId !== req.user!.id) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(cookingIdeasTable).where(eq(cookingIdeasTable.id, params.data.id));
  res.sendStatus(204);
});

router.patch("/ideas/:id/like", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LikeIdeaParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ idea: cookingIdeasTable, author: usersTable })
    .from(cookingIdeasTable)
    .leftJoin(usersTable, eq(cookingIdeasTable.authorId, usersTable.id))
    .where(eq(cookingIdeasTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Cooking idea not found" });
    return;
  }

  const [updated] = await db.update(cookingIdeasTable).set({ likesCount: row.idea.likesCount + 1 }).where(eq(cookingIdeasTable.id, params.data.id)).returning();
  res.json(formatIdea(updated, row.author));
});

router.get("/ideas/:id/reviews", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListIdeaReviewsParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const reviews = await db
    .select({ review: ideaReviewsTable, author: usersTable })
    .from(ideaReviewsTable)
    .leftJoin(usersTable, eq(ideaReviewsTable.authorId, usersTable.id))
    .where(eq(ideaReviewsTable.ideaId, params.data.id))
    .orderBy(desc(ideaReviewsTable.createdAt));

  res.json(reviews.map(({ review, author }) => ({
    id: review.id,
    ideaId: review.ideaId,
    authorId: review.authorId,
    authorName: author?.name ?? "Unknown",
    comment: review.comment,
    rating: review.rating,
    createdAt: review.createdAt,
  })));
});

router.post("/ideas/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateIdeaReviewParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = CreateIdeaReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [idea] = await db.select().from(cookingIdeasTable).where(eq(cookingIdeasTable.id, params.data.id));
  if (!idea) {
    res.status(404).json({ error: "Cooking idea not found" });
    return;
  }

  const [review] = await db.insert(ideaReviewsTable).values({
    ideaId: params.data.id,
    authorId: req.user!.id,
    comment: parsed.data.comment,
    rating: parsed.data.rating,
  }).returning();

  await db.update(cookingIdeasTable).set({ reviewCount: idea.reviewCount + 1 }).where(eq(cookingIdeasTable.id, params.data.id));

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, review.authorId));

  res.status(201).json({
    id: review.id,
    ideaId: review.ideaId,
    authorId: review.authorId,
    authorName: author?.name ?? "Unknown",
    comment: review.comment,
    rating: review.rating,
    createdAt: review.createdAt,
  });
});

export default router;
