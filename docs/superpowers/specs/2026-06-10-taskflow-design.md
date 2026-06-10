# TaskFlow — Design Spec
**Date:** 2026-06-10
**Status:** Approved

---

## Overview

A full-stack Task and Time Tracking web app. Users manage tasks using natural language input (AI-enhanced via Groq), track time against tasks with a real-time timer, and view daily productivity summaries with charts.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), TailwindCSS, React Router v6, React Query |
| Backend | Node.js, Express |
| Database | MongoDB via Mongoose |
| Auth | BetterAuth (email/password, HTTP-only session cookies) |
| AI | Groq API — `llama-3.1-8b-instant` |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Railway (backend + MongoDB) |

---

## Project Structure

```
taskflow/
├── client/
│   ├── src/
│   │   ├── api/           # React Query hooks (useTasks, useTimeLogs, useSummary)
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Route-level views
│   │   ├── lib/           # axios instance, utils
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── routes/        # tasks, timelogs, auth, summary
│   │   ├── controllers/   # business logic per resource
│   │   ├── models/        # Task, TimeLog (Mongoose schemas)
│   │   ├── middleware/    # authGuard, validate, errorHandler
│   │   ├── lib/           # groq client, betterauth setup
│   │   └── index.ts
│   └── package.json
├── package.json            # root workspaces
└── .env.example
```

---

## Data Models

### Task
```ts
{
  _id: ObjectId,
  userId: string,           // BetterAuth user id
  title: string,            // AI-refined title
  description: string,      // AI-generated description
  rawInput: string,         // original user input
  status: "pending" | "in_progress" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

### TimeLog
```ts
{
  _id: ObjectId,
  userId: string,
  taskId: ObjectId,         // ref → Task
  startedAt: Date,
  stoppedAt: Date | null,   // null = actively running
  duration: number          // seconds; computed on stop
}
```

**No Summary model** — daily summary is computed at query time by aggregating TimeLogs where `startedAt` falls within today's UTC date range, grouped by `taskId`.

---

## API Design

All protected routes require a valid BetterAuth session cookie. Every response follows `{ success: boolean, data?, error? }`.

### Auth (BetterAuth — auto-generated)
```
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
POST /api/auth/sign-out
GET  /api/auth/get-session
```

### Tasks
```
GET    /api/tasks              list all tasks for current user
POST   /api/tasks              create task: rawInput → Groq → save
GET    /api/tasks/:id          get single task with total time
PATCH  /api/tasks/:id          update title / description / status
DELETE /api/tasks/:id          delete task + its time logs
```

### Time Logs
```
POST   /api/tasks/:id/start    create TimeLog { startedAt: now, stoppedAt: null }
                               → 409 if another timer already running
POST   /api/tasks/:id/stop     set stoppedAt, compute duration
GET    /api/tasks/:id/logs     list logs for task, include totalDuration
```

### Summary
```
GET    /api/summary/today      aggregate today's logs (UTC midnight to now):
                               - tasks worked on
                               - total time tracked (seconds)
                               - count by status
                               - per-task time breakdown
```

---

## Frontend Pages & Routes

```
/              redirect → /dashboard (authed) or /login
/login         Login page
/signup        Signup page
/dashboard     Task list + active timer banner
/tasks/:id     Task detail + time log history
/summary       Daily summary with charts
```

### Component Tree

```
Layout
├── Sidebar (nav: Dashboard, Summary, Logout)
└── TopBar (current date, user name)

Auth/
├── AuthForm (shared login/signup, mode prop)

Tasks/
├── TaskInput        natural language input + Add button
├── TaskList         React Query list with skeleton states
├── TaskCard         title, status badge, total time, Start/Stop
├── StatusBadge      amber=pending, indigo=in_progress, green=completed
└── EditTaskModal    edit title / description / status

Timer/
├── TimerDisplay     live HH:MM:SS (setInterval from startedAt)
└── ActiveTaskBanner sticky top banner: running task + elapsed time

Summary/
├── SummaryStats     stat cards: tasks worked, total time, completed
├── TimeByTaskChart  Recharts horizontal bar chart (time per task)
└── TaskStatusChart  Recharts donut chart (status distribution)
```

---

## Auth Flow

BetterAuth mounts at `/api/auth/*` as Express middleware. Uses `mongooseAdapter` connected to the same Mongoose instance.

- Session stored as HTTP-only, `SameSite=lax`, `Secure` cookie
- `authGuard` middleware calls `auth.api.getSession()` on protected routes
- `401` returned on missing/expired session
- Frontend uses BetterAuth's `authClient.useSession()` hook
- `<PrivateRoute>` wrapper redirects to `/login` if no session

---

## Real-Time Timer

**Start:**
1. `POST /api/tasks/:id/start` → server creates TimeLog, returns `startedAt`
2. `useTimer(startedAt)` hook: `setInterval(1000)` computing `Date.now() - startedAt`
3. `TimerDisplay` renders seconds as `HH:MM:SS`

**Stop:**
1. `POST /api/tasks/:id/stop` → server sets `stoppedAt`, computes `duration`
2. Client clears interval, React Query invalidates task + summary queries

**Constraint:** Only one active timer per user. `POST /api/tasks/:id/start` returns `409 Conflict` if `TimeLog.findOne({ userId, stoppedAt: null })` exists.

---

## AI Integration (Groq)

Called server-side inside `POST /api/tasks` controller:

```
rawInput → Groq llama-3.1-8b-instant
prompt: "Given this raw task input, return JSON only: { title: string, description: string }"
→ parse response JSON → save to Task
```

**Fallback:** If Groq fails (timeout, malformed JSON, API error) → save `title = rawInput`, `description = ""`. Task creation never fails due to AI.

---

## Design System

- **Style:** Micro-interactions (150–300ms transitions, `active:scale-95` feedback)
- **Background:** `#0F172A` (dark navy)
- **Primary:** `#D97706` (amber — "active/tracking")
- **Accent/CTA:** `#6366F1` (indigo)
- **Destructive:** `#DC2626` (red)
- **Font:** Plus Jakarta Sans (300/400/500/600/700)
- **Icons:** Lucide React (SVG, no emojis)
- **Charts:** Recharts — horizontal bar (time by task), donut (status split)

---

## Deployment

### Vercel (Frontend)
- Deploy `client/` as Vite app
- Env: `VITE_API_URL=https://<railway-backend>.up.railway.app`

### Railway (Backend + DB)
- Service `server`: Node/Express from `server/`
- Plugin `mongodb`: managed MongoDB (provides `MONGO_URI`)
- Env vars:
  ```
  MONGO_URI
  BETTER_AUTH_SECRET
  BETTER_AUTH_URL
  GROQ_API_KEY
  CLIENT_URL
  ```
- CORS: `{ origin: CLIENT_URL, credentials: true }`

---

## Error Handling

- All Express routes wrapped in `asyncHandler` to catch thrown errors
- Global `errorHandler` middleware returns `{ success: false, error: message }`
- Zod validation on all request bodies → `400` with field-level errors
- `authGuard` → `401` on missing/expired session
- Resource ownership check on every task/log mutation → `403` if userId mismatch
- Timer conflict → `409 Conflict`
- Groq failure → silent fallback, task still created

---

## Bonus Features (in scope)

- Daily summary charts (bar + donut via Recharts)
- Per-task total time display on TaskCard
- Active timer banner persists across navigation within the app
