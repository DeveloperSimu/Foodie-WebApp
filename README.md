# Foodie

Foodie is a food discovery and ordering web application. Visitors can browse dishes, while signed-in users can use account features such as wishlists, orders, comments, recipe ideas, and short videos. Cafe accounts can manage their menus and incoming orders.

## Features

- Browse dishes, search and filter the menu, and view dish details
- Register and sign in as a user or cafe
- Save dishes to a wishlist and place orders
- Share cooking ideas, comment on posts, and browse short videos
- Manage cafe dishes and incoming orders with a cafe account
- Access a separate admin login and dashboard for managing local demo content
- Responsive layout for desktop and mobile

## Tech stack

- React 19, TypeScript, Vite, and Tailwind CSS
- Express API with JWT-based user authentication
- PostgreSQL and Drizzle ORM for the full database-backed API
- pnpm workspace monorepo

## Requirements

- Node.js
- pnpm

## Install

From the repository root:

```bash
pnpm install
```

## Run the frontend

```bash
pnpm --filter @workspace/foodie run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Admin dashboard without a database

The admin-only server provides admin login and session verification without connecting to PostgreSQL. It is suitable for using the dashboard's browser-local demo content.

In a second terminal, run the API server with server-side admin credentials:

```powershell
$env:PORT = "8080"
$env:FOODIE_ADMIN_EMAIL = "your-admin-email"
$env:FOODIE_ADMIN_PASSWORD = "choose-a-strong-password"
pnpm --filter @workspace/api-server run admin
```

Keep this terminal running, then visit [http://localhost:5173/admin/login](http://localhost:5173/admin/login) and sign in with the email and password configured above.

Admin credentials must be configured on the server; they are not included in the frontend or this README. The admin-only server keeps sessions in memory for up to eight hours. Restarting the server invalidates existing sessions. In this mode, dashboard changes are stored in the current browser's local storage and are not shared with other browsers or users. Database-backed API features, such as persistent accounts and orders, are unavailable.

## Run the full database-backed API

The full API requires a PostgreSQL database. Set its connection URL and a private JWT signing secret in the API server's environment, then start the server:

```powershell
$env:PORT = "8080"
$env:DATABASE_URL = "your-postgresql-connection-url"
$env:SESSION_SECRET = "your-private-user-session-secret"
pnpm --filter @workspace/api-server run dev
```

For admin login with the full API, also configure `FOODIE_ADMIN_EMAIL` and `FOODIE_ADMIN_PASSWORD`. Do not commit real credentials, database URLs, or signing secrets to source control.

## Build and type-check

Build the frontend:

```bash
pnpm --filter @workspace/foodie run build
```

Type-check the API server:

```bash
pnpm --filter @workspace/api-server run typecheck
```

## Workspace layout

```text
artifacts/
  api-server/       Express API and standalone admin-only server
  foodie/           React web application
lib/
  api-client-react/ Generated API client and React Query hooks
  api-spec/         API specification
  api-zod/          Shared API validation schemas
  db/               Drizzle database schema and connection
```
