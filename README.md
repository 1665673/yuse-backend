# Yuse REST backend

Express + MongoDB + JWT auth + Swagger UI.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, and optionally `ADMIN_USERNAME` / `ADMIN_PASSWORD` to create an admin user on first boot (only if that username does not exist).

2. Install and run:

```bash
npm install
npm run dev
```

For production, `npm start` (or `npm run serve-dist`) runs **`node dist/index.js` only** — it does **not** run `tsc`, so it will not interrupt a running server or trigger a full compile. The `dist/` folder is kept in the repo; after editing `src/`, run **`npm run build`** and commit the updated `dist/` if you rely on checked-in output.

**If `Cannot find module .../dist/index.js`:** run `npm run build` once (requires `typescript` in devDependencies), or pull a revision that includes `dist/`.

**Deploy with only production dependencies:** on the server, `npm install --omit=dev` and `npm start` (or `node dist/index.js`) as long as `dist/` is present. To rebuild from source in CI, use `npm ci && npm run build` then deploy `dist/` (and `package.json` / lockfile as needed).

Default port: **4000**. Open **http://localhost:4000/api-docs** for Swagger.

## Auth

- `POST /api/auth/register` — `{ "username", "password" }` → always creates a **reviewer** account.
- `POST /api/auth/login` — `{ "username", "password" }` → `{ token, user }`.
- `GET /api/auth/me` — `Authorization: Bearer <jwt>`.

Admins are created via env bootstrap (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) or by inserting a user in MongoDB with `role: "admin"`.

## Tasks

- `GET /api/tasks` — list summaries (**JWT required**).
- `POST /api/tasks` — create (**JWT required**).
- `GET /api/tasks/:taskId` — full task JSON (**public**, for learner demo).
- `PUT /api/tasks/:taskId` — replace task JSON (**JWT required**).
- `DELETE /api/tasks/:taskId` — delete (**JWT required**).
- `GET /api/task` — full JSON of the latest task (**public**, home demo).

## Upload

- `POST /api/upload` — `multipart/form-data` field `file` (**JWT required**). Returns `{ url }` using `PUBLIC_BASE_URL` or `http://localhost:<PORT>`.

## Demo app integration

Run MongoDB, then this server, then the Next app in `demo/`. The Next config rewrites `/api/*` to this backend (`BACKEND_URL`, default `http://127.0.0.1:4000`).
