# Yuse REST backend

Express + MongoDB + JWT auth + Swagger UI.

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, and optionally `ADMIN_USERNAME` / `ADMIN_PASSWORD` to create an admin user on first boot (only if that username does not exist).

2. Install and run:

```bash
npm install
npm run dev
```

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
