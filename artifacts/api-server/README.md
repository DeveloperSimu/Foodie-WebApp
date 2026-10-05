# API server configuration

Admin access is configured on the API server and is not available through normal user or cafe accounts. Admin sessions are stored in server memory, expire after eight hours, and are invalidated when the server restarts.

- `FOODIE_ADMIN_EMAIL`: the admin login email.
- `FOODIE_ADMIN_PASSWORD`: the admin login password.

For a local dashboard that stores its content in this browser's local storage and does not use a database, start only the standalone admin authentication server:

```powershell
$env:PORT = "8080"
$env:FOODIE_ADMIN_EMAIL = "your-admin-email"
$env:FOODIE_ADMIN_PASSWORD = "your-strong-admin-password"
pnpm --filter @workspace/api-server run admin
```

This admin-only server does not connect to PostgreSQL. Run the frontend separately on port 5173 and sign in at `/admin/login`. Database-backed food, order, and account APIs are unavailable in this mode; content edited in the admin dashboard remains local to this browser.

For the complete application API, use `pnpm --filter @workspace/api-server run dev` instead and configure `DATABASE_URL` and `SESSION_SECRET` as well.
