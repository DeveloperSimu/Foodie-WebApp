import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAdmin, signToken, requireAuth } from "../lib/auth";
import {
  adminCredentialsMatch,
  createAdminSession,
  isAdminConfigured,
  revokeAdminSession,
} from "../lib/admin-session";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role, avatarUrl } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role, avatarUrl: avatarUrl || null }).returning();

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/admin/login", (req, res): void => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Admin authentication is not configured on the server" });
    return;
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !adminCredentialsMatch(email, password)) {
    res.status(401).json({ error: "Invalid admin email or password" });
    return;
  }

  res.json({ token: createAdminSession() });
});

router.get("/auth/admin/me", requireAdmin, (_req, res): void => {
  res.json({ authenticated: true });
});

router.post("/auth/admin/logout", requireAdmin, (req, res): void => {
  const token = req.headers.authorization?.slice(7);
  if (token) revokeAdminSession(token);
  res.sendStatus(204);
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
  });

  router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
    const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : undefined;
    const avatarUrl = typeof req.body?.avatarUrl === "string" ? req.body.avatarUrl.trim() : undefined;
    if (!name || name.length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    if (avatarUrl && !/^https?:\/\/\S+$/i.test(avatarUrl)) {
      res.status(400).json({ error: "Profile image must be a valid URL" });
      return;
    }
    const [user] = await db.update(usersTable)
      .set({ name, bio: bio || null, avatarUrl: avatarUrl || null })
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarUrl: user.avatarUrl ?? null, bio: user.bio ?? null, createdAt: user.createdAt,
    });
  });
});

export default router;
