import { Router, type IRouter } from "express";
import { db, shortsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateShortBody,
  GetShortParams,
  LikeShortParams,
  DeleteShortParams,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

function formatShort(short: typeof shortsTable.$inferSelect, author: typeof usersTable.$inferSelect | null) {
  return {
    id: short.id,
    title: short.title,
    description: short.description ?? null,
    videoUrl: short.videoUrl,
    thumbnailUrl: short.thumbnailUrl ?? null,
    authorId: short.authorId,
    authorName: author?.name ?? "Unknown",
    authorRole: author?.role ?? "user",
    views: short.views,
    likes: short.likes,
    createdAt: short.createdAt,
  };
}

router.get("/shorts", optionalAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ short: shortsTable, author: usersTable })
    .from(shortsTable)
    .leftJoin(usersTable, eq(shortsTable.authorId, usersTable.id))
    .orderBy(desc(shortsTable.createdAt));

  res.json(rows.map(({ short, author }) => formatShort(short, author)));
});

router.post("/shorts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateShortBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, videoUrl, thumbnailUrl } = parsed.data;

  const [short] = await db.insert(shortsTable).values({
    title,
    description: description ?? null,
    videoUrl,
    thumbnailUrl: thumbnailUrl ?? null,
    authorId: req.user!.id,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, short.authorId));
  res.status(201).json(formatShort(short, author));
});

router.get("/shorts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetShortParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ short: shortsTable, author: usersTable })
    .from(shortsTable)
    .leftJoin(usersTable, eq(shortsTable.authorId, usersTable.id))
    .where(eq(shortsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Short not found" });
    return;
  }

  await db.update(shortsTable).set({ views: row.short.views + 1 }).where(eq(shortsTable.id, params.data.id));

  res.json(formatShort({ ...row.short, views: row.short.views + 1 }, row.author));
});

router.delete("/shorts/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteShortParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(shortsTable).where(eq(shortsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Short not found" });
    return;
  }
  if (existing.authorId !== req.user!.id) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(shortsTable).where(eq(shortsTable.id, params.data.id));
  res.sendStatus(204);
});

router.patch("/shorts/:id/like", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LikeShortParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ short: shortsTable, author: usersTable })
    .from(shortsTable)
    .leftJoin(usersTable, eq(shortsTable.authorId, usersTable.id))
    .where(eq(shortsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Short not found" });
    return;
  }

  const [updated] = await db.update(shortsTable).set({ likes: row.short.likes + 1 }).where(eq(shortsTable.id, params.data.id)).returning();
  res.json(formatShort(updated, row.author));
});

export default router;
