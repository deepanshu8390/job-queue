# Job Queue Dashboard

A polished CRUD dashboard for creating, filtering, viewing, advancing, and deleting jobs. It is intentionally a display/management product: it does **not** execute jobs or include workers, authentication, brokers, or queue infrastructure.

## Stack and architecture

- **React + Vite (JavaScript):** Builds the responsive dashboard, create-job form, filters, search, pagination, status controls, and loading/error/empty states.
- **NestJS (JavaScript):** Exposes the REST API and keeps request handling, validation, domain rules, and persistence concerns separate.
- **SQLite with `better-sqlite3`:** Provides a lightweight persistent database stored locally at `backend/data/jobs.sqlite`.

### Core application concept

This application is a **job-management dashboard**, not a job runner. A job is a record with an ID, title, type, status, optional JSON payload, and creation timestamp. Users can create jobs, search and filter them, view paginated results, change their status through valid lifecycle steps, and delete them.

The backend follows this flow:

```text
React UI → Jobs Controller → Jobs Service → Job Repository → SQLite Adapter → SQLite database
```

- The **controller** receives HTTP requests and passes validated input to the service.
- The **service** contains application rules, such as creating a job as `pending` and checking whether a status transition is permitted.
- The **repository** defines database operations in business-friendly methods such as `findPaginated`, `create`, and `updateStatus`.
- The **SQLite adapter** contains the actual SQL and database setup details.

This separation keeps the code easy to test, maintain, and explain. For example, SQLite can later be replaced with PostgreSQL by creating another adapter while keeping controllers and business rules largely unchanged.

### Design patterns used

| Pattern | Where it is used | Why it is useful |
| --- | --- | --- |
| **State Pattern** | `PendingState`, `RunningState`, `CompletedState`, and `FailedState` define allowed next statuses. | Keeps job lifecycle rules isolated and prevents a large conditional chain in the service. Terminal jobs cannot be changed. |
| **Factory Pattern** | `JobStateFactory.create(job.status)` returns the state object for the current status. | Centralizes state-object creation and rejects unknown statuses consistently. |
| **Abstract base class + polymorphism** | `Job` is an abstract-style base class; `EmailJob`, `ReportJob`, `DataProcessingJob`, and `NotificationJob` extend it. | Models job types cleanly and makes new job types easy to add without changing existing job behavior. |
| **Repository Pattern** | `JobRepository` exposes database operations to the service. | Prevents SQL from leaking into business logic and makes persistence easier to test or replace. |
| **Adapter Pattern** | `SqliteJobAdapter` implements the database-specific work behind the repository. | Decouples the application from SQLite and provides a clear migration path to another database. |

### Important implementation details

- Every new job starts in the `pending` state; clients cannot create a job directly as `running`, `completed`, or `failed`.
- Valid transitions are `pending → running`, `pending → failed`, and `running → completed`.
- Status changes use an atomic database update (`WHERE id = ? AND status = ?`). If another request changes the job first, the API returns `409 Conflict` instead of silently overwriting data.
- The paginated jobs API returns both the visible jobs and aggregate status counts in one response, avoiding a separate count request from the frontend.
- Search is debounced by one second so typing does not make an API request for every character.

## Run locally

Requires Node 20+ and npm.

```bash
npm install
npm run install:all
npm run dev
```

Open `http://localhost:5173`; API is at `http://localhost:3000/api`. Optional environment variables: `PORT`, `FRONTEND_ORIGIN`, `DATABASE_PATH`, and frontend `VITE_API_URL`.

### Environment setup

Environment files are intentionally not committed. Create local files from the provided templates:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

For local development, the defaults work without changes. For deployment, the backend and frontend must be told where the other application lives:

| Application | Variable | Example production value | Purpose |
| --- | --- | --- | --- |
| Frontend | `VITE_API_URL` | `https://api.example.com/api` | The URL the browser uses for every API request. Vite embeds this value during the frontend build. |
| Backend | `FRONTEND_ORIGIN` | `https://jobs.example.com` | The allowed browser origin for CORS. Do not add `/api` here. |
| Backend | `PORT` | Platform-provided value | API listening port; most hosts provide this automatically. |
| Backend | `DATABASE_PATH` | `/data/jobs.sqlite` | SQLite file location. Use a persistent volume path in production. |

After changing `frontend/.env`, restart the Vite server locally or create a new production build; `VITE_*` variables are build-time values. Backend environment variables are read when the API starts. On a deployment platform, set these values in its environment-variable dashboard instead of uploading an `.env` file.

SQLite is initialized automatically on the first backend start, with indexes for status, type, and creation time. The database is stored at `backend/data/jobs.sqlite`; that folder is created automatically and database files are excluded from Git. Copy `backend/.env.example` to `backend/.env` if you want to document local values, or set `DATABASE_PATH` in your shell to use another persistent location. Delete `backend/data/jobs.sqlite` only if you explicitly want a fresh local database.

When the database is empty, the API also creates ten starter jobs across email, report, data-processing, and notification types. Existing jobs are never overwritten or duplicated.

## API

`POST /api/jobs` accepts `{ "title", "type", "payload?" }`; types are `email`, `report`, `data-processing`, and `notification`. New jobs always begin `pending`.

`GET /api/jobs?page=1&limit=6&status=&type=&search=` returns `{ data, meta }`. `GET /api/jobs/:id` reads a job; `GET /api/jobs/counts` returns status totals. `PATCH /api/jobs/:id/status` accepts `{ "status" }`; valid transitions are pending → running/failed and running → completed. `DELETE /api/jobs/:id` removes it.

Errors use `{ success:false, error:{ code, message } }`. Atomic `UPDATE ... WHERE status = oldStatus` prevents status writes from silently overwriting concurrent changes and returns 409 on conflict.

## Tests and deployment

Run backend tests with `npm test --prefix backend`. Deploy the frontend as a static site using `npm run build --prefix frontend`, after setting `VITE_API_URL`. Deploy `backend` as a Node service using `npm start --prefix backend`, set `FRONTEND_ORIGIN`, and attach persistent storage for `DATABASE_PATH`. SQLite needs a persistent disk and is therefore not appropriate for stateless/serverless API hosting; use a host with a mounted volume, or migrate the adapter to PostgreSQL for that environment. Future work could add authentication, PostgreSQL, richer type payload validation, and frontend component tests.
