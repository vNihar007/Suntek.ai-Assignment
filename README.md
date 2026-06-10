# TaskFlow — Task & Time Tracking App

> Full-stack productivity app with AI-enhanced task creation, real-time time tracking, and daily summary charts.

---

## Live Demo

| | |
|---|---|
| **Demo video** | https://www.loom.com/share/9277d49ff1f842c38235ffa8cf03a3bb |

**Test credentials** (optional — or sign up fresh):
```
Email:    demo@taskflow.com
Password: demo1234
```

---

## What It Does

Users type a task in plain English. Groq AI (Llama 3.1) instantly refines it into a clean title and structured description. From there, users can:

- Start a real-time timer on any task — elapsed seconds tick live in the browser
- Stop the timer — duration is computed server-side and stored as a `TimeLog`
- Only one timer can run at a time per user (enforced at the API level)
- View a daily summary page showing time-per-task charts and status breakdowns
- Edit, update status, or delete tasks at any point

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│   React + Vite + TailwindCSS + React Query       │
│                                                  │
│  /login  /signup  /dashboard  /tasks/:id         │
│  /summary                                        │
└───────────────────┬─────────────────────────────┘
                    │  HTTPS  (credentials: include)
                    │
┌───────────────────▼─────────────────────────────┐
│              Express API  :3001                  │
│                                                  │
│  /api/auth/*     → BetterAuth (sessions)         │
│  /api/tasks/*    → Task CRUD + Groq enhance      │
│  /api/tasks/:id  → Timer start / stop / logs     │
│  /api/summary    → MongoDB aggregation           │
│                                                  │
│  Middleware stack:                               │
│    cors → toNodeHandler(auth) → express.json()   │
│    → authGuard → validate(zod) → controller      │
│    → asyncHandler → errorHandler                 │
└───────────────────┬─────────────────────────────┘
                    │  mongoose
                    │
┌───────────────────▼─────────────────────────────┐
│           MongoDB Atlas                          │
│                                                  │
│  Collections (BetterAuth-managed):               │
│    user · session · account · verification       │
│                                                  │
│  Collections (app-managed):                      │
│    tasks · timelogs                              │
└─────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Why |
|---|---|
| **BetterAuth** for auth | Handles sessions, cookies, and the user model — no custom `User` model needed |
| **Server-side timer truth** | `startedAt` / `stoppedAt` are persisted; duration computed on stop. Browser only renders a `setInterval` counter from `startedAt` |
| **React Query** owns all server state | No `useState` for remote data; mutations call `invalidateQueries` on success |
| **Groq AI server-side only** | API key never reaches the browser; task still created if Groq fails |
| **No Summary model** | Daily summary is a MongoDB aggregation on `TimeLog` filtered to UTC midnight today |
| **One active timer constraint** | `POST /api/tasks/:id/start` returns `409` if a `TimeLog` with `stoppedAt: null` already exists for the user |

---

## Project Structure

```
Suntek.ai_assignment/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── api/                # React Query hooks
│       │   ├── useTasks.ts
│       │   ├── useTimeLogs.ts
│       │   └── useSummary.ts
│       ├── components/
│       │   ├── tasks/          # TaskCard, TaskInput, TaskList, EditTaskModal
│       │   ├── timer/          # ActiveTaskBanner, TimerDisplay
│       │   ├── summary/        # SummaryStats, TimeByTaskChart, TaskStatusChart
│       │   ├── layout/         # Sidebar, TopBar, Layout
│       │   └── ui/             # Button, Input, Modal, Toast, Skeleton
│       ├── hooks/
│       │   └── useTimer.ts     # setInterval hook driven by startedAt
│       ├── lib/
│       │   ├── auth-client.ts  # BetterAuth client (createAuthClient)
│       │   └── axios.ts        # Axios instance (baseURL + withCredentials)
│       └── pages/
│           ├── DashboardPage.tsx
│           ├── TaskDetailPage.tsx
│           ├── SummaryPage.tsx
│           ├── LoginPage.tsx
│           └── SignupPage.tsx
│
└── server/                     # Express backend (TypeScript)
    └── src/
        ├── controllers/
        │   ├── taskController.ts     # CRUD + Groq enhance
        │   ├── timeController.ts     # start / stop / logs
        │   └── summaryController.ts  # aggregation pipeline
        ├── models/
        │   ├── Task.ts         # userId, title, description, rawInput, status
        │   └── TimeLog.ts      # userId, taskId, startedAt, stoppedAt, duration
        ├── routes/
        │   ├── tasks.ts
        │   ├── timers.ts
        │   └── summary.ts
        ├── middleware/
        │   ├── authGuard.ts    # calls auth.api.getSession → sets req.user
        │   ├── errorHandler.ts
        │   └── asyncHandler.ts
        └── lib/
            ├── auth.ts         # BetterAuth instance (mongodbAdapter)
            ├── db.ts           # Mongoose connect
            └── groq.ts         # Groq SDK wrapper (enhanceTask)
```

---

## Data Models

### Task
| Field | Type | Notes |
|---|---|---|
| `userId` | String | Indexed; ties task to BetterAuth user |
| `title` | String | AI-generated or falls back to raw input |
| `description` | String | AI-generated or empty |
| `rawInput` | String | Original user text, always stored |
| `status` | `pending` \| `in_progress` \| `completed` | Default `pending` |

### TimeLog
| Field | Type | Notes |
|---|---|---|
| `userId` | String | Indexed |
| `taskId` | ObjectId → Task | Indexed |
| `startedAt` | Date | Set on start |
| `stoppedAt` | Date \| null | `null` = timer running |
| `duration` | Number (seconds) | Computed server-side on stop |

---

## API Reference

### Auth  `(BetterAuth — /api/auth/*)`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET  | `/api/auth/get-session` | Current session |

### Tasks  `(all protected)`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks` | Create task (AI-enhanced) |
| GET | `/api/tasks/:id` | Get single task + total duration |
| PATCH | `/api/tasks/:id` | Update title / description / status |
| DELETE | `/api/tasks/:id` | Delete task + all its time logs |

### Timer
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks/:id/start` | Start timer — `409` if one already running |
| POST | `/api/tasks/:id/stop` | Stop timer, compute duration |
| GET | `/api/tasks/:id/logs` | All time log entries for a task |

### Summary
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/summary/today` | Aggregated stats for today |

Every response follows `{ success: boolean, data?: T, error?: string }`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router v6 |
| Server state | TanStack React Query v5 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas via Mongoose |
| Auth | BetterAuth v1 — HTTP-only session cookies |
| AI | Groq API — `llama-3.1-8b-instant` |
| Charts | Recharts |
| Validation | Zod |
| Deployment | Vercel (frontend) + Railway (backend + MongoDB) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone and install

```bash
git clone https://github.com/vNihar007/Suntek.ai-Assignment.git
cd Suntek.ai-Assignment

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

**`server/.env`** (copy from `server/.env.example`):
```env
PORT=3001
MONGO_URI=<your MongoDB Atlas connection string>
BETTER_AUTH_SECRET=<any random 32-char string>
BETTER_AUTH_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=<your Groq API key>
```

**`client/.env`** (copy from `client/.env.example`):
```env
VITE_API_URL=http://localhost:3001
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd server
npm run dev
# → Server running on port 3001
```

```bash
# Terminal 2 — frontend
cd client
npm run dev
# → http://localhost:5173
```

### 4. Verify

```bash
curl http://localhost:3001/health
# {"success":true,"message":"API RUNING"}
```

Open `http://localhost:5173` — sign up, create a task, start a timer.

---

## Feature Checklist (Evaluation Criteria)

| Area | What's implemented |
|---|---|
| **Authentication** | BetterAuth email/password — HTTP-only session cookies, `authGuard` middleware on every protected route, full user data isolation |
| **Task Management** | Create (AI-enhanced via Groq), list, view detail, edit title/description/status, delete — all scoped to `req.user.id` |
| **Time Tracking** | Start/stop per task, live elapsed counter (`useTimer` hook), session stored as `TimeLog`, one active timer enforced with `409` |
| **Daily Summary** | MongoDB aggregation for today's logs — total time, tasks worked, completed vs in-progress, Recharts bar + donut charts |
| **API Design** | REST, Zod input validation, `asyncHandler` wrapper, central `errorHandler`, consistent `{ success, data, error }` shape |
| **Deployment** | Frontend → Vercel, Backend + DB → Railway |
| **UI/UX** | Dark design system (amber + indigo), responsive layout, skeleton loaders, toast notifications, `active:scale-95` press feedback |
| **Bonus** | Recharts productivity charts (time per task, status distribution), daily aggregation pipeline |
