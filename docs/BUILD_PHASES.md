# TaskFlow Backend — Phased Build Plan

**How to use this document:** Work through one phase at a time. Each phase ends with a working checkpoint — a thing you can run and verify. Never skip to a later phase without completing the one before it. All commands run from `server/` unless stated otherwise.

---

## Current State

- ✅ `client/` — React frontend fully built
- ✅ Design spec at `docs/superpowers/specs/2026-06-10-taskflow-design.md`
- ✅ `CLAUDE.md` with architecture rules
- ❌ `server/` — does not exist yet (this plan builds it entirely)

---

## Phase Overview


| Phase | Name                      | Time Estimate | Checkpoint                                                                               |
| ----- | ------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| 0     | Scaffold + Dependencies   | 15 min        | `npm run dev` prints "Server running on port 3001"                                       |
| 1     | MongoDB + Mongoose Models | 20 min        | `Task.create()` and `TimeLog.create()` succeed in test script                            |
| 2     | BetterAuth + authGuard    | 30 min        | `POST /api/auth/sign-up/email` creates user, `GET /api/auth/get-session` returns session |
| 3     | Task CRUD                 | 45 min        | `GET/POST/PATCH/DELETE /api/tasks` all return correct responses with auth enforced       |
| 4     | Timer Routes              | 30 min        | Start/stop timer creates and updates TimeLogs; 409 on double-start                       |
| 5     | Groq AI Enhancement       | 20 min        | `POST /api/tasks` with raw input returns AI-refined title + description                  |
| 6     | Daily Summary             | 20 min        | `GET /api/summary/today` returns aggregated stats                                        |
| 7     | CORS + Deployment Prep    | 15 min        | Frontend + backend communicate cross-origin with cookies working                         |


---

## Phase 0: Scaffold + Dependencies

**Goal:** A running Express server with TypeScript, proper tsconfig, all dependencies installed, and a health-check route.

**Time estimate:** 15 minutes

---

### Task 0.1 — Create server directory and package.json

**Input:** Empty `server/` directory.

**Steps:**

```bash
mkdir server && cd server
npm init -y
```

Edit `server/package.json` to this exact content:

```json
{
  "name": "taskflow-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

**Tools:**

- No installs yet — just sets up the manifest.

---

### Task 0.2 — Install all dependencies

**Input:** `server/package.json` exists.

**Steps:**

```bash
# Runtime deps
npm install express better-auth @better-auth/mongoose mongoose groq-sdk zod cors dotenv

# Dev deps
npm install -D typescript tsx @types/node @types/express @types/cors
```

**Tools:**

- `express` — HTTP server framework
- `better-auth` — auth library (sign-up, sign-in, sessions)
- `@better-auth/mongoose` — BetterAuth Mongoose adapter
- `mongoose` — MongoDB ODM
- `groq-sdk` — official Groq API client
- `zod` — request body validation
- `cors` — CORS middleware for cross-origin cookie support
- `dotenv` — loads `.env` into `process.env`
- `tsx` — runs TypeScript directly (dev only, no compile step)

---

### Task 0.3 — TypeScript config

**Input:** Dependencies installed.

**Create `server/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Task 0.4 — Entry point + health check

**Input:** tsconfig ready.

**Create `server/src/index.ts`:**

```typescript
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json())
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
```

**Create `server/.env`:**

```
PORT=3001
MONGO_URI=mongodb://localhost:27017/taskflow
BETTER_AUTH_SECRET=change-this-to-a-random-32-char-string
BETTER_AUTH_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_key_here
```

**Create `server/.env.example`** (same as `.env` but with empty values):

```
PORT=3001
MONGO_URI=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
CLIENT_URL=
GROQ_API_KEY=
```

---

### Phase 0 Checkpoint ✓

```bash
cd server && npm run dev
```

```
# Expected output:
# Server running on port 3001
```

```bash
curl http://localhost:3001/health
# Expected output:
# {"success":true,"message":"TaskFlow API running"}
```

- [ ] Server starts without errors
- [ ] `/health` returns JSON

---

## Phase 1: MongoDB + Mongoose Models

**Goal:** Database connected, Task and TimeLog schemas defined, both can be created and queried.

**Time estimate:** 20 minutes

---

### Task 1.1 — MongoDB connection

**Input:** Phase 0 complete, `MONGO_URI` set in `.env`.

**Note:** For local dev, install MongoDB locally or use [MongoDB Atlas free tier](https://www.mongodb.com/atlas). For Atlas, replace `MONGO_URI` with your connection string.

**Create `server/src/lib/db.ts`:**

```typescript
import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not set')

  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
```

**Update `server/src/index.ts`** — add DB connect before `app.listen`:

```typescript
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { connectDB } from './lib/db'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(express.json())
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API running' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})

export default app
```

---

### Task 1.2 — Task model

**Input:** DB connection works.

**Create `server/src/models/Task.ts`:**

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface ITask extends Document {
  userId: string
  title: string
  description: string
  rawInput: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    userId:      { type: String, required: true, index: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    rawInput:    { type: String, required: true },
    status:      { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  },
  { timestamps: true }
)

export const Task = mongoose.model<ITask>('Task', TaskSchema)
```

---

### Task 1.3 — TimeLog model

**Input:** Task model created.

**Create `server/src/models/TimeLog.ts`:**

```typescript
import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ITimeLog extends Document {
  userId: string
  taskId: Types.ObjectId
  startedAt: Date
  stoppedAt: Date | null
  duration: number
}

const TimeLogSchema = new Schema<ITimeLog>({
  userId:    { type: String, required: true, index: true },
  taskId:    { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  startedAt: { type: Date, required: true },
  stoppedAt: { type: Date, default: null },
  duration:  { type: Number, default: 0 },
})

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', TimeLogSchema)
```

---

### Phase 1 Checkpoint ✓

**Create a temporary test script `server/src/test-db.ts`:**

```typescript
import dotenv from 'dotenv'
import { connectDB } from './lib/db'
import { Task } from './models/Task'
import { TimeLog } from './models/TimeLog'

dotenv.config()

async function run() {
  await connectDB()

  const task = await Task.create({
    userId: 'test-user-1',
    title: 'Test Task',
    rawInput: 'test task',
  })
  console.log('Task created:', task._id.toString())

  const log = await TimeLog.create({
    userId: 'test-user-1',
    taskId: task._id,
    startedAt: new Date(),
  })
  console.log('TimeLog created:', log._id.toString())

  await Task.deleteOne({ _id: task._id })
  await TimeLog.deleteOne({ _id: log._id })
  console.log('Cleanup done')
  process.exit(0)
}

run().catch(console.error)
```

```bash
cd server && npx tsx src/test-db.ts
```

```
# Expected output:
# MongoDB connected
# Task created: <some ObjectId>
# TimeLog created: <some ObjectId>
# Cleanup done
```

- [ ] Both models create and clean up without error
- [ ] Delete `src/test-db.ts` after verifying

---

## Phase 2: BetterAuth + authGuard Middleware

**Goal:** Users can sign up and sign in. Every protected route can verify the session. `req.user` is available after `authGuard`.

**Time estimate:** 30 minutes

---

### Task 2.1 — BetterAuth instance

**Input:** Phase 1 complete, Mongoose connected.

**Create `server/src/lib/auth.ts`:**

```typescript
import { mongooseAdapter } from '@better-auth/mongoose'
import { betterAuth } from 'better-auth'
import mongoose from 'mongoose'

export const auth = betterAuth({
  database: mongooseAdapter(mongoose),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:5173'],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
})
```

---

### Task 2.2 — Mount BetterAuth routes

**Input:** `auth` instance created.

**Update `server/src/index.ts`** — add auth handler before other routes:

```typescript
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth'
import { connectDB } from './lib/db'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// BetterAuth handles its own body parsing — mount BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

// express.json() for all other routes
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API running' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})

export default app
```

**Why BetterAuth mounts before `express.json()`:** BetterAuth uses its own body parser internally. If Express parses the body first, BetterAuth's parser will receive an empty stream and fail silently.

---

### Task 2.3 — authGuard middleware

**Input:** BetterAuth routes mounted.

**Create `server/src/middleware/authGuard.ts`:**

```typescript
import { toNodeHandler } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import { auth } from '../lib/auth'

declare global {
  namespace Express {
    interface Request {
      user: { id: string; email: string; name: string }
    }
  }
}

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: req.headers as any })
  if (!session?.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  req.user = { id: session.user.id, email: session.user.email, name: session.user.name }
  next()
}
```

---

### Task 2.4 — asyncHandler + errorHandler middleware

**Input:** authGuard created.

**Create `server/src/middleware/asyncHandler.ts`:**

```typescript
import type { NextFunction, Request, RequestHandler, Response } from 'express'

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}
```

**Create `server/src/middleware/errorHandler.ts`:**

```typescript
import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, error: err.errors[0]?.message ?? 'Validation error' })
    return
  }
  const message = err instanceof Error ? err.message : 'Internal server error'
  const status = (err as any).status ?? 500
  res.status(status).json({ success: false, error: message })
}
```

**Update `server/src/index.ts`** — add errorHandler at bottom (after all routes):

```typescript
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth'
import { connectDB } from './lib/db'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))

app.all('/api/auth/*splat', toNodeHandler(auth))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API running' })
})

// routes will be added here in Phase 3+

app.use(errorHandler)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})

export default app
```

---

### Phase 2 Checkpoint ✓

```bash
# Sign up a new user
curl -s -c /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}' | jq .
```

```
# Expected output (abbreviated):
# { "user": { "id": "...", "email": "test@test.com", "name": "Test User" }, "session": { ... } }
```

```bash
# Check session using the cookie
curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/auth/get-session | jq .
```

```
# Expected output:
# { "user": { "email": "test@test.com", ... }, "session": { ... } }
```

- [ ] Sign-up returns user + session object
- [ ] `get-session` returns the same user when cookie is passed
- [ ] Re-running sign-up with same email returns an error (duplicate)

---

## Phase 3: Task CRUD

**Goal:** All five task endpoints work with auth enforcement and ownership checks. Creating a task saves it; only the owner can read/update/delete it.

**Time estimate:** 45 minutes

---

### Task 3.1 — Task controller

**Input:** Phase 2 complete, `authGuard` and `asyncHandler` ready.

**Create `server/src/controllers/taskController.ts`:**

```typescript
import type { Request, Response } from 'express'
import { z } from 'zod'
import { TimeLog } from '../models/TimeLog'
import { Task } from '../models/Task'
import { asyncHandler } from '../middleware/asyncHandler'

const createSchema = z.object({ rawInput: z.string().min(1).max(500) })
const updateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status:      z.enum(['pending', 'in_progress', 'completed']).optional(),
})

// Helper: attach totalDuration + activeLog to a task document
async function enrichTask(task: InstanceType<typeof Task>, userId: string) {
  const logs = await TimeLog.find({ taskId: task._id, userId })
  const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0)
  const activeLog = logs.find((l) => l.stoppedAt === null) ?? null
  return {
    ...task.toObject(),
    totalDuration,
    activeLog: activeLog ? { _id: activeLog._id, startedAt: activeLog.startedAt } : null,
  }
}

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 })
  const enriched = await Promise.all(tasks.map((t) => enrichTask(t, req.user.id)))
  res.json({ success: true, data: enriched })
})

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
  res.json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { rawInput } = createSchema.parse(req.body)

  // AI enhancement — imported lazily to avoid circular deps; fallback handled in Phase 5
  let title = rawInput
  let description = ''
  try {
    const { enhanceTask } = await import('../lib/groq')
    const result = await enhanceTask(rawInput)
    title = result.title
    description = result.description
  } catch {
    // Groq failed — use raw input as title, empty description
  }

  const task = await Task.create({ userId: req.user.id, title, description, rawInput })
  res.status(201).json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSchema.parse(req.body)
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: data },
    { new: true }
  )
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
  res.json({ success: true, data: await enrichTask(task, req.user.id) })
})

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }
  await TimeLog.deleteMany({ taskId: task._id })
  res.json({ success: true, data: null })
})
```

---

### Task 3.2 — Task router

**Input:** Task controller created.

**Create `server/src/routes/tasks.ts`:**

```typescript
import { Router } from 'express'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController'
import { authGuard } from '../middleware/authGuard'

const router = Router()

router.use(authGuard)

router.get('/',     listTasks)
router.post('/',    createTask)
router.get('/:id',  getTask)
router.patch('/:id',updateTask)
router.delete('/:id',deleteTask)

export default router
```

---

### Task 3.3 — Mount task router

**Input:** Task router created.

**Update `server/src/index.ts`** — add task routes:

```typescript
import taskRoutes from './routes/tasks'

// after app.use(express.json())
app.use('/api/tasks', taskRoutes)
```

---

### Phase 3 Checkpoint ✓

```bash
# Create a task (cookie from Phase 2 signup still valid)
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"rawInput":"follow up with designer"}' | jq .
```

```
# Expected output:
# { "success": true, "data": { "_id": "...", "title": "follow up with designer", "status": "pending", ... } }
# Note: title = rawInput because Groq isn't wired yet (Phase 5)
```

```bash
# List tasks
curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/tasks | jq '.data | length'
# Expected: 1
```

```bash
# Try without auth — should 401
curl -s http://localhost:3001/api/tasks
# Expected: {"success":false,"error":"Unauthorized"}
```

- [ ] `POST /api/tasks` creates a task
- [ ] `GET /api/tasks` returns array with the task
- [ ] No cookie → 401
- [ ] `PATCH` and `DELETE` work on the created task
- [ ] `PATCH` on a different user's task ID returns 404

---

## Phase 4: Timer Routes

**Goal:** Start and stop timer creates/updates TimeLogs. 409 is returned if a timer is already running. `GET /logs` returns full history with totalDuration.

**Time estimate:** 30 minutes

---

### Task 4.1 — Timer controller

**Input:** Phase 3 complete, TimeLog model available.

**Create `server/src/controllers/timerController.ts`:**

```typescript
import type { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { Task } from '../models/Task'
import { TimeLog } from '../models/TimeLog'

export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  // Only one active timer per user at a time
  const activeLog = await TimeLog.findOne({ userId: req.user.id, stoppedAt: null })
  if (activeLog) {
    res.status(409).json({ success: false, error: 'Another timer is already running. Stop it first.' })
    return
  }

  const log = await TimeLog.create({
    userId:    req.user.id,
    taskId:    task._id,
    startedAt: new Date(),
    stoppedAt: null,
    duration:  0,
  })

  res.status(201).json({ success: true, data: log })
})

export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  const log = await TimeLog.findOne({ taskId: task._id, userId: req.user.id, stoppedAt: null })
  if (!log) { res.status(404).json({ success: false, error: 'No active timer for this task' }); return }

  const stoppedAt = new Date()
  const duration = Math.floor((stoppedAt.getTime() - log.startedAt.getTime()) / 1000)

  log.stoppedAt = stoppedAt
  log.duration  = duration
  await log.save()

  res.json({ success: true, data: log })
})

export const getTimeLogs = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
  if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return }

  const logs = await TimeLog.find({ taskId: task._id, userId: req.user.id }).sort({ startedAt: -1 })
  const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0)

  res.json({ success: true, data: { logs, totalDuration } })
})
```

---

### Task 4.2 — Timer routes + mount

**Input:** Timer controller created.

**Create `server/src/routes/timers.ts`:**

```typescript
import { Router } from 'express'
import { getTimeLogs, startTimer, stopTimer } from '../controllers/timerController'
import { authGuard } from '../middleware/authGuard'

const router = Router({ mergeParams: true })

router.use(authGuard)

router.post('/start', startTimer)
router.post('/stop',  stopTimer)
router.get('/logs',   getTimeLogs)

export default router
```

**Update `server/src/index.ts`** — mount timer routes under tasks:

```typescript
import timerRoutes from './routes/timers'

// after app.use('/api/tasks', taskRoutes)
app.use('/api/tasks/:id', timerRoutes)
```

---

### Phase 4 Checkpoint ✓

```bash
# Get the task ID from Phase 3
TASK_ID=$(curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/tasks | jq -r '.data[0]._id')
echo "Task ID: $TASK_ID"

# Start the timer
curl -s -b /tmp/taskflow-cookies.txt -c /tmp/taskflow-cookies.txt \
  -X POST http://localhost:3001/api/tasks/$TASK_ID/start | jq .
```

```
# Expected:
# { "success": true, "data": { "startedAt": "...", "stoppedAt": null, "duration": 0 } }
```

```bash
# Try to start another timer — should 409
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks/$TASK_ID/start | jq .
# Expected: {"success":false,"error":"Another timer is already running..."}

# Stop the timer
sleep 2
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks/$TASK_ID/stop | jq .
# Expected: { "success": true, "data": { "stoppedAt": "...", "duration": 2 } }

# View logs
curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/tasks/$TASK_ID/logs | jq .
# Expected: { "success": true, "data": { "logs": [...], "totalDuration": 2 } }
```

- [ ] Start creates a TimeLog with `stoppedAt: null`
- [ ] Double-start returns `409`
- [ ] Stop sets `stoppedAt` and computes `duration` in seconds
- [ ] `GET /logs` returns logs + totalDuration

---

## Phase 5: Groq AI Enhancement

**Goal:** `POST /api/tasks` calls Groq to refine the raw input into a proper title and description. If Groq fails, the task is still created using the raw input — no user-facing error.

**Time estimate:** 20 minutes

---

### Task 5.1 — Groq client

**Input:** Phase 4 complete, `GROQ_API_KEY` set in `.env`. Get your key from [console.groq.com](https://console.groq.com) (free).

**Create `server/src/lib/groq.ts`:**

```typescript
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const PROMPT = `You are a productivity assistant. Given a raw task description, return a JSON object with two fields:
- "title": a concise, action-oriented task title (max 60 characters)
- "description": a clear one-sentence description of what needs to be done (max 150 characters)

Return ONLY valid JSON. No markdown, no explanation, no extra text.`

export async function enhanceTask(rawInput: string): Promise<{ title: string; description: string }> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: PROMPT },
      { role: 'user', content: rawInput },
    ],
    temperature: 0.3,
    max_tokens: 200,
  })

  const content = completion.choices[0]?.message?.content?.trim() ?? ''

  // Strip markdown code fences if the model includes them despite instructions
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
    throw new Error('Unexpected response shape from Groq')
  }

  return { title: parsed.title, description: parsed.description }
}
```

The `createTask` controller in Phase 3 already calls `enhanceTask` via a dynamic import and falls back on error — **no changes needed to the controller**.

---

### Phase 5 Checkpoint ✓

```bash
# Create a new task using natural language
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"rawInput":"follow up with designer about wireframes"}' | jq '{title: .data.title, description: .data.description}'
```

```
# Expected output (AI-generated, will vary):
# {
#   "title": "Follow Up with Designer on Wireframes",
#   "description": "Contact the designer to check on wireframe delivery and confirm the timeline."
# }
```

- [ ] Title is refined (not the raw input verbatim)
- [ ] Description is present and meaningful
- [ ] Creating a task with `GROQ_API_KEY` unset still succeeds — title = rawInput, description = ""

---

## Phase 6: Daily Summary

**Goal:** `GET /api/summary/today` returns total time tracked, task count by status, and per-task breakdown — all aggregated from today's TimeLogs.

**Time estimate:** 20 minutes

---

### Task 6.1 — Summary controller

**Input:** Phase 5 complete.

**Create `server/src/controllers/summaryController.ts`:**

```typescript
import type { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { Task } from '../models/Task'
import { TimeLog } from '../models/TimeLog'

export const getTodaySummary = asyncHandler(async (req: Request, res: Response) => {
  // UTC midnight today
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  // All time logs for this user that started today
  const logs = await TimeLog.find({
    userId:    req.user.id,
    startedAt: { $gte: todayStart },
  })

  if (!logs.length) {
    res.json({
      success: true,
      data: {
        totalDuration: 0,
        tasksWorked: 0,
        completedCount: 0,
        pendingCount: 0,
        inProgressCount: 0,
        tasks: [],
      },
    })
    return
  }

  // Aggregate duration per task
  const durationByTask = new Map<string, number>()
  for (const log of logs) {
    const id = log.taskId.toString()
    durationByTask.set(id, (durationByTask.get(id) ?? 0) + log.duration)
  }

  const taskIds = [...durationByTask.keys()]
  const tasks = await Task.find({ _id: { $in: taskIds }, userId: req.user.id })

  const taskSummaries = tasks.map((t) => ({
    taskId:        t._id.toString(),
    title:         t.title,
    status:        t.status,
    totalDuration: durationByTask.get(t._id.toString()) ?? 0,
  }))

  const totalDuration   = taskSummaries.reduce((s, t) => s + t.totalDuration, 0)
  const completedCount  = tasks.filter((t) => t.status === 'completed').length
  const pendingCount    = tasks.filter((t) => t.status === 'pending').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length

  res.json({
    success: true,
    data: {
      totalDuration,
      tasksWorked: tasks.length,
      completedCount,
      pendingCount,
      inProgressCount,
      tasks: taskSummaries,
    },
  })
})
```

---

### Task 6.2 — Summary router + mount

**Input:** Summary controller created.

**Create `server/src/routes/summary.ts`:**

```typescript
import { Router } from 'express'
import { getTodaySummary } from '../controllers/summaryController'
import { authGuard } from '../middleware/authGuard'

const router = Router()

router.get('/today', authGuard, getTodaySummary)

export default router
```

**Update `server/src/index.ts`** — mount summary route:

```typescript
import summaryRoutes from './routes/summary'

// after timer routes
app.use('/api/summary', summaryRoutes)
```

---

### Phase 6 Checkpoint ✓

```bash
# Start and stop a couple more timers first (so there's data today)
TASK_ID=$(curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/tasks | jq -r '.data[0]._id')
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks/$TASK_ID/start > /dev/null
sleep 3
curl -s -b /tmp/taskflow-cookies.txt -X POST http://localhost:3001/api/tasks/$TASK_ID/stop > /dev/null

# Get today's summary
curl -s -b /tmp/taskflow-cookies.txt http://localhost:3001/api/summary/today | jq .
```

```
# Expected output:
# {
#   "success": true,
#   "data": {
#     "totalDuration": 5,
#     "tasksWorked": 1,
#     "completedCount": 0,
#     "pendingCount": 1,
#     "inProgressCount": 0,
#     "tasks": [{ "taskId": "...", "title": "...", "status": "pending", "totalDuration": 5 }]
#   }
# }
```

- [ ] `totalDuration` reflects actual seconds tracked
- [ ] `tasksWorked` matches number of distinct tasks with logs today
- [ ] No auth → 401

---

## Phase 7: CORS + Deployment Prep

**Goal:** Frontend and backend communicate cross-origin with session cookies. Backend is Railway-ready.

**Time estimate:** 15 minutes

---

### Task 7.1 — Final index.ts (complete file)

**Input:** All phases complete.

Replace `server/src/index.ts` with the final version that includes all routes in the correct order:

```typescript
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth'
import { connectDB } from './lib/db'
import { errorHandler } from './middleware/errorHandler'
import summaryRoutes from './routes/summary'
import taskRoutes from './routes/tasks'
import timerRoutes from './routes/timers'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

// CORS must come first — before any route handlers
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,   // required for BetterAuth session cookies
}))

// BetterAuth before express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TaskFlow API running' })
})

app.use('/api/tasks',    taskRoutes)
app.use('/api/tasks/:id', timerRoutes)
app.use('/api/summary',   summaryRoutes)

app.use(errorHandler)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err)
  process.exit(1)
})

export default app
```

---

### Task 7.2 — Railway deployment config

**Input:** Final `index.ts` written.

**Create `server/Procfile`** (Railway uses this):

```
web: node dist/index.js
```

**Create `server/.railwayignore`:**

```
node_modules
src
tsconfig.json
```

**Update `server/package.json` scripts** to include a `build` that Railway runs:

```json
{
  "scripts": {
    "dev":       "tsx watch src/index.ts",
    "build":     "tsc",
    "start":     "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "engines": {
    "node": ">=18"
  }
}
```

Railway auto-detects Node projects, runs `npm run build` then `npm run start`.

**Environment variables to set on Railway:**


| Variable             | Value                                   |
| -------------------- | --------------------------------------- |
| `MONGO_URI`          | from Railway MongoDB plugin             |
| `BETTER_AUTH_SECRET` | any 32+ char random string              |
| `BETTER_AUTH_URL`    | `https://<your-service>.up.railway.app` |
| `GROQ_API_KEY`       | from console.groq.com                   |
| `CLIENT_URL`         | `https://<your-vercel-app>.vercel.app`  |


---

### Task 7.3 — Verify full-stack locally

Start both servers:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open `http://localhost:5173`, sign up, create a task — verify it appears in the dashboard.

---

### Phase 7 Checkpoint ✓

```bash
npm run typecheck
```

```
# Expected: no output (zero errors)
```

```bash
npm run build
```

```
# Expected: creates dist/ directory with compiled JS
# No TypeScript errors
```

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npm run build` creates `dist/index.js`
- [ ] Frontend at `:5173` can sign up and create a task against `:3001`
- [ ] Session cookie persists across page refresh

---

## Quick Reference: File → Phase Map


| File                                          | Phase                        | Depends On                               |
| --------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `server/package.json`                         | 0                            | —                                        |
| `server/tsconfig.json`                        | 0                            | —                                        |
| `server/src/index.ts`                         | 0 → updated in 2, 3, 4, 6, 7 | all modules                              |
| `server/.env`                                 | 0                            | —                                        |
| `server/src/lib/db.ts`                        | 1                            | mongoose                                 |
| `server/src/models/Task.ts`                   | 1                            | mongoose, db.ts                          |
| `server/src/models/TimeLog.ts`                | 1                            | mongoose, db.ts                          |
| `server/src/lib/auth.ts`                      | 2                            | better-auth, mongoose, db.ts             |
| `server/src/middleware/authGuard.ts`          | 2                            | auth.ts                                  |
| `server/src/middleware/asyncHandler.ts`       | 2                            | —                                        |
| `server/src/middleware/errorHandler.ts`       | 2                            | zod                                      |
| `server/src/controllers/taskController.ts`    | 3                            | Task, TimeLog, asyncHandler, groq (lazy) |
| `server/src/routes/tasks.ts`                  | 3                            | taskController, authGuard                |
| `server/src/controllers/timerController.ts`   | 4                            | Task, TimeLog, asyncHandler              |
| `server/src/routes/timers.ts`                 | 4                            | timerController, authGuard               |
| `server/src/lib/groq.ts`                      | 5                            | groq-sdk                                 |
| `server/src/controllers/summaryController.ts` | 6                            | Task, TimeLog, asyncHandler              |
| `server/src/routes/summary.ts`                | 6                            | summaryController, authGuard             |
| `server/Procfile`                             | 7                            | —                                        |


---

## Time Budget Summary


| Phase          | Minimum    | Maximum    | Skippable? | Notes                                     |
| -------------- | ---------- | ---------- | ---------- | ----------------------------------------- |
| 0 — Scaffold   | 10 min     | 20 min     | No         | Foundation                                |
| 1 — Models     | 10 min     | 25 min     | No         | DB connection can take time on Atlas      |
| 2 — Auth       | 20 min     | 45 min     | No         | BetterAuth mount order matters            |
| 3 — Task CRUD  | 30 min     | 60 min     | No         | Core feature                              |
| 4 — Timer      | 20 min     | 40 min     | No         | Core feature                              |
| 5 — Groq       | 10 min     | 20 min     | Yes        | App works without it; tasks use rawInput  |
| 6 — Summary    | 15 min     | 25 min     | Yes        | Summary page shows empty state without it |
| 7 — Deployment | 10 min     | 30 min     | Yes        | Only needed for live deploy               |
| **Total**      | **~2 hrs** | **~4 hrs** |            |                                           |


