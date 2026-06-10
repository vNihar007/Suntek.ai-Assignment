# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Project Is

**TaskFlow** — a full-stack Task and Time Tracking SaaS. Users create tasks via natural language input (AI-enhanced by Groq), track time with a real-time timer, and view daily productivity summaries with charts.

Full design spec: `docs/superpowers/specs/2026-06-10-taskflow-design.md`
Design system: `design-system/taskflow/MASTER.md`

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), TailwindCSS, React Router v6, React Query |
| Backend | Node.js + Express (TypeScript) |
| Database | MongoDB via Mongoose |
| Auth | BetterAuth — email/password, HTTP-only session cookies |
| AI | Groq API — `llama-3.1-8b-instant` |
| Charts | Recharts |
| Deployment | Vercel (client) + Railway (server + MongoDB) |

---

## Dev Commands

From repo root (npm workspaces):

```bash
npm install              # install all deps (client + server)
npm run dev              # start both client and server concurrently
npm run dev:client       # Vite dev server only (http://localhost:5173)
npm run dev:server       # Express server only (http://localhost:3001)
npm run build            # production build for both
npm run build:client     # Vite build → client/dist
npm run build:server     # tsc → server/dist
```

From `server/`:
```bash
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
```

---

## Environment Variables

Copy `.env.example` to `.env` in `server/`:

```
MONGO_URI=
BETTER_AUTH_SECRET=        # random 32-char string
BETTER_AUTH_URL=           # http://localhost:3001 locally
GROQ_API_KEY=              # from console.groq.com
CLIENT_URL=                # http://localhost:5173 locally
```

Copy `.env.example` to `.env` in `client/`:
```
VITE_API_URL=http://localhost:3001
```

---

## Architecture

### Monorepo Layout
```
taskflow/
├── client/src/
│   ├── api/           # React Query hooks — useTasks, useTimeLogs, useSummary
│   ├── components/    # Tasks/, Timer/, Summary/, shared UI
│   ├── pages/         # route-level views matching React Router paths
│   └── lib/           # axios instance (baseURL + withCredentials), utils
├── server/src/
│   ├── routes/        # thin routers — delegate to controllers
│   ├── controllers/   # all business logic lives here
│   ├── models/        # Task.ts, TimeLog.ts (Mongoose schemas)
│   ├── middleware/    # authGuard, validate (Zod), errorHandler, asyncHandler
│   └── lib/           # betterauth.ts (auth instance), groq.ts (client)
```

### Key Architectural Rules

**Server state is owned by React Query.** Never use `useState` to hold data that comes from the API. All mutations call `queryClient.invalidateQueries()` on success to keep the UI fresh.

**Timer display is client-side; timer truth is server-side.** `POST /api/tasks/:id/start` returns `startedAt`. The `useTimer(startedAt)` hook runs `setInterval(1000)` computing elapsed seconds locally. Only the `startedAt` / `stoppedAt` timestamps are persisted. `duration` is computed server-side on stop (`stoppedAt - startedAt` in seconds).

**BetterAuth owns the user model entirely.** Never create a `User` Mongoose model. BetterAuth creates `user`, `session`, `account`, `verification` collections automatically via `mongooseAdapter`. `req.user` is populated by `authGuard` calling `auth.api.getSession()`.

**Groq is called server-side only.** The AI enhancement happens inside `POST /api/tasks` controller. The API key never reaches the client. If Groq fails (timeout / malformed JSON), the task is still created with `title = rawInput`, `description = ""` — creation never fails.

**No Summary Mongoose model.** Daily summary is a MongoDB aggregation on `TimeLog` where `startedAt >= UTC midnight today`.

### Request/Response Shape

Every API response: `{ success: boolean, data?: T, error?: string }`

Every protected route passes through `authGuard` → `req.user` is set or `401` is returned. Every mutation checks `resource.userId === req.user.id` or returns `403`.

### Active Timer Constraint

Only one timer per user at a time. `POST /api/tasks/:id/start` checks `TimeLog.findOne({ userId, stoppedAt: null })` — returns `409 Conflict` if one exists.

---

## Frontend Routes

```
/              → redirect (authed → /dashboard, else → /login)
/login
/signup
/dashboard     → task list + active timer banner
/tasks/:id     → task detail + time log history
/summary       → daily summary with charts
```

Protected routes are wrapped in `<PrivateRoute>` which checks `authClient.useSession()`.

---

## Design System

Full system at `design-system/taskflow/MASTER.md`. Short reference:

| Token | Value |
|-------|-------|
| Background | `#0F172A` |
| Primary (amber) | `#D97706` |
| Accent/CTA (indigo) | `#6366F1` |
| Destructive | `#DC2626` |
| Font | Plus Jakarta Sans |

- Icons: **Lucide React only** — no emojis as icons
- Transitions: **150–300ms** on all interactive states
- Buttons use `active:scale-95` press feedback
- Status colors: amber = pending, indigo = in_progress, green = completed
- Charts: Recharts — horizontal bar (time per task), donut (status split)

---

## Deployment

- **Frontend → Vercel**: deploy `client/`, set `VITE_API_URL` to Railway backend URL
- **Backend → Railway**: deploy `server/`, attach Railway MongoDB plugin for `MONGO_URI`
- CORS must be `{ origin: CLIENT_URL, credentials: true }` — required for BetterAuth cookies cross-origin
