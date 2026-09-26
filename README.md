# Shared Task Board

A lightweight, real-time collaborative task board built with **FastAPI**, **SQLite**, and **React**. Designed for small teams, project groups, and hackathons with zero setup: anyone with the URL can open the board, select their name, and immediately track tasks in sync with everyone else.

---

## Features

- **Zero-Setup Identity**: No passwords or sign-up. Pick your name from the group roster or add yourself with one click.
- **Three-Column Kanban Board**: Track tasks in `To Do`, `In Progress`, and `Done`.
- **Card Controls**:
  - Quick action move buttons (`Start →`, `Done ✓`, `← To Do`, `↺ Reopen`) and direct column dropdown.
  - In-place editing of task title, description, assignee, and status.
  - Delete task with confirmation dialog.
- **People Management**:
  - Add new group members directly from the UI.
  - Assign tasks to members or leave them unassigned.
  - Filter tasks by "All", "My Tasks", "Unassigned", or by specific member.
- **Multi-Browser Sync**:
  - Periodic polling (every 3.5s) keeps all connected browsers synchronized.
  - Immediate optimistic updates on task creation, edits, status transitions, and deletions.
  - Live sync indicator showing connection state and timestamp of last synchronization.
- **Durable Server Persistence**:
  - Backed by an on-disk SQLite database (`backend/data/tasks.db`) using WAL mode for high concurrency.
  - Survives browser restarts, reloads, and complete server process restarts.
- **Single Process Deployment**:
  - FastAPI serves both the REST API (`/api/*`) and the built React single-page application (`/`) on a single port.

---

## Project Structure

```text
Xempla/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── crud.py          # SQLite database query functions
│   │   ├── database.py      # SQLite connection & schema initialization
│   │   ├── main.py          # FastAPI app & routing (API + SPA static files)
│   │   └── models.py        # Pydantic schemas for tasks and people
│   ├── tests/
│   │   └── test_api.py      # Automated backend tests (CRUD, validation, persistence)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx         # 3-column board layout
│   │   │   ├── NewTaskForm.jsx   # Create task modal dialog
│   │   │   ├── PersonPicker.jsx  # Member roster, identity selector, assignee dropdown
│   │   │   └── TaskCard.jsx      # Task card with inline editing & status controls
│   │   ├── api.js           # Fetch API client
│   │   ├── App.jsx          # Top-level state, polling loop, filters
│   │   ├── index.css        # Responsive styling & CSS variables
│   │   └── main.jsx         # React DOM mount point
│   ├── package.json
│   └── vite.config.js       # Vite configuration with /api proxy
├── run.py                   # Single-command runner (builds frontend & runs FastAPI)
└── README.md
```

---

## Quickstart

### 1. Requirements
- Python 3.10+
- Node.js 18+ and npm

### 2. Setup

```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..
```

### 3. Run (Single Process)

Run the entire application (API + React UI) on a single port:

```bash
source .venv/bin/activate
python3 run.py
```

- **Web App**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Development Mode

For rapid frontend and backend development with hot-reloading:

1. **Start the FastAPI backend**:
   ```bash
   source .venv/bin/activate
   uvicorn backend.app.main:app --reload --port 8000
   ```

2. **Start the Vite frontend dev server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173). Requests to `/api/*` are automatically proxied to `http://localhost:8000`.

---

## Running Tests

Automated backend tests cover all CRUD endpoints, status transitions, validation errors, and database persistence across restarts:

```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests
```

---

## API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a task (`title`, optional `description`, `assignee`, `status`) |
| `PATCH` | `/api/tasks/{id}` | Update task title, description, assignee, or status |
| `DELETE` | `/api/tasks/{id}` | Delete a task by UUID |
| `GET` | `/api/people` | List all group members |
| `POST` | `/api/people` | Add a person to the group (`{"name": "Alice"}`) |

---

## PRD Open Questions Addressed

1. **Archiving/hiding `Done` tasks**:
   - For v1, the board displays all tasks with clear column count indicators. A filter bar is provided so users can easily focus on their own tasks or specific assignees.
   - For a fast-follow, an "Archive Done" button or toggle ("Hide Completed") can be added without altering the database schema (e.g. via an `is_archived` boolean or a `GET /api/tasks?include_archived=false` query parameter).
2. **Task ordering within columns**:
   - Tasks are sorted chronologically by creation time (`created_at ASC`), keeping column lists predictable. Drag-and-drop reordering with a `position` float or integer can be added as a fast-follow.
