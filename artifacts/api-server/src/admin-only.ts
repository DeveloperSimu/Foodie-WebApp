import express from "express";
import { adminCredentialsMatch, createAdminSession, isAdminConfigured, isAdminSessionValid, revokeAdminSession } from "./lib/admin-session";

const app = express();
const port = Number(process.env.PORT || 8080);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

app.use(express.json({ limit: "16kb" }));

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", mode: "admin-only" });
});

app.post("/api/auth/admin/login", (req, res) => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Set FOODIE_ADMIN_EMAIL and FOODIE_ADMIN_PASSWORD before starting the admin server." });
    return;
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !adminCredentialsMatch(email, password)) {
    res.status(401).json({ error: "Invalid admin email or password" });
    return;
  }

  res.json({ token: createAdminSession() });
});

app.get("/api/auth/admin/me", (req, res) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  if (!token || !isAdminSessionValid(token)) {
    res.status(401).json({ error: "Invalid or expired admin session" });
    return;
  }
  res.json({ authenticated: true });
});

app.post("/api/auth/admin/logout", (req, res) => {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  if (token) revokeAdminSession(token);
  res.sendStatus(204);
});

app.use("/api", (_req, res) => {
  res.status(503).json({ error: "This server is running in admin-only mode. Database-backed API features are unavailable." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Foodie admin-only server listening on port ${port}`);
});
