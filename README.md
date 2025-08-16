# Mini PM — Local Setup & Architecture Guide

A lightweight **multi-tenant project management** app.

- **Backend**: Django 4.x + GraphQL (Graphene) + PostgreSQL/SQLite
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Apollo Client
- **Multi‑tenancy**: Organization-scoped data via the `X-Org-Slug` header

---

## Table of Contents

1. [Quick Start (Local)](#quick-start-local)
2. [Architecture](#architecture)
3. [Data Modeling](#data-modeling)
4. [API Design (GraphQL Best Practices)](#api-design-graphql-best-practices)
5. [Frontend Patterns](#frontend-patterns)
6. [API Documentation (Sample Queries/Mutations)](#api-documentation-sample-queriesmutations)
7. [Environment & Configuration](#environment--configuration)
8. [Troubleshooting](#troubleshooting)
9. [Future Improvements](#future-improvements)

---

## Quick Start (Local)

> Works out of the box with **SQLite**. Switch to **PostgreSQL** for real dev.

### Prerequisites
- Python **3.11+** (3.12 works)
- Node.js **v20** (we pinned Vite plugin versions for Node 20)
- npm **10+**
- Git
- (Optional) Docker Desktop (for PostgreSQL)

### 1) Backend

```bash
# from repo root (contains manage.py)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Generate DB tables
python manage.py makemigrations
python manage.py migrate

# (Optional) create admin user
python manage.py createsuperuser

# Run the API
python manage.py runserver 0.0.0.0:8000
```

- GraphQL endpoint: **http://localhost:8000/graphql/**
- Django admin: **http://localhost:8000/admin/**

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
# open: http://localhost:5173
```

> The frontend GraphQL URL is set in `frontend/src/apollo.ts`:
> ```ts
> const httpLink = createHttpLink({ uri: "http://localhost:8000/graphql/" });
> ```
> Change it if your backend runs elsewhere.

### 3) Multi‑tenant Header
All GraphQL operations are **scoped by Organization** using a request header:
```
X-Org-Slug: <your-org-slug>
```
The frontend stores this in localStorage and injects it automatically. You can also test in GraphiQL by adding the header in the **HTTP Headers** panel.

---

## Architecture

### Clean Separation of Concerns

```
repo/
├─ backend/ (Django project) or root with manage.py
│  ├─ core/                      # apps: organization, project, task
│  ├─ schema.py                  # Graphene schema (Query/Mutation)
│  ├─ tenancy/middleware.py      # pulls org from headers → request context
│  ├─ models.py                  # ORM models (Organization, Project, Task, TaskComment)
│  └─ ...
└─ frontend/                     # React + Vite + Apollo + Tailwind
   ├─ src/
   │  ├─ apollo.ts               # client, links, error handling
   │  ├─ graphql/                # GQL documents (queries/mutations)
   │  ├─ ui/                     # presentational + container components
   │  │  ├─ ProjectCard.tsx
   │  │  ├─ ProjectsSimple.tsx
   │  │  ├─ ProjectDetails.tsx   # board with DnD, editor, comments
   │  │  ├─ TaskForm.tsx / TaskEditor.tsx / TaskCard.tsx
   │  │  ├─ Modal.tsx / Button.tsx / StatusBadge.tsx / TopBar.tsx
   │  │  └─ OrgPicker.tsx
   │  └─ App.tsx / main.tsx
   └─ index.html / tailwind config / vite.config.ts
```

- **Backend** owns domain rules and multi‑tenancy (org isolation in resolvers).
- **GraphQL layer** exposes typed schema and hides ORM details.
- **Frontend** is purely client concerns: fetching, composing UI, optimistic UX.

### Proper Abstractions
- **Tenancy**: a single source of truth (middleware) extracts `org_slug`, resolvers query with `organization=<ctx.org>` to guarantee isolation.
- **Resolvers/Services**: mutations call small service functions (create/update) so logic is testable and reusable.
- **UI Composition**: small components (Card, Modal, Button) + page containers (Projects grid, Project details).

---

## Data Modeling

### Entities & Relationships
- **Organization** *(1)* ↔ *(N)* **Project**
- **Project** *(1)* ↔ *(N)* **Task**
- **Task** *(1)* ↔ *(N)* **TaskComment**

### Constraints & Indices
- `Organization.slug` → **unique index** (fast lookup by header).
- `Project(organization, name)` → optional **unique_together** to prevent duplicates per org.
- FK `on_delete=CASCADE` to clean child rows when a parent is removed.
- Choices:
  - `Project.status ∈ { ACTIVE, COMPLETED, ON_HOLD }`
  - `Task.status ∈ { TODO, IN_PROGRESS, DONE }`

### Data Integrity
- Mutations always validate the current **organization context**; no cross‑org access.
- Email fields use `EmailField` (server‑side validation).

---

## API Design (GraphQL Best Practices)

- **Single `/graphql/` endpoint**: explicit queries/mutations with typed responses.
- **Context-based tenancy**: `X-Org-Slug` maps to an `Organization`; resolvers filter by it.
- **Mutations return payload objects** (`ok`, `errors?`, `node`) for forward compatibility.
- **Pagination-ready**: queries can adopt `first/after` later without breaking clients.
- **Consistent scalars**: `Date`/`DateTime` used for due dates and timestamps.
- **Validation & Errors**: Surface clear messages; never leak internal identifiers across orgs.

Example mutation shape:
```graphql
mutation CreateProject($name: String!, $status: String!, $description: String, $dueDate: Date) {
  createProject(name: $name, status: $status, description: $description, dueDate: $dueDate) {
    ok
    project { id name status dueDate }
  }
}
```

---

## Frontend Patterns

- **Apollo Client** for fetching, cache, and **optimistic updates** on drag/drop + edits.
- **Component Composition**:
  - Atoms: `Button`, `StatusBadge`
  - Molecules: `ProjectCard`, `TaskCard`
  - Organisms: `ProjectsSimple` (grid), `ProjectDetails` (board, editor)
- **State Management**:
  - Server state: Apollo cache
  - Local UI state: `useState`/`useMemo` inside components (modal open, selected task)
- **GraphQL Integration**:
  - Error link logs GraphQL/Network issues
  - `X-Org-Slug` injected via `setContext` link from `localStorage`
- **UX Polish**:
  - Tailwind for consistent spacing/typography
  - Modal sizes (`size="full"`) for roomy boards
  - Drag & Drop via `@hello-pangea/dnd` (type-only imports, no CSS transforms on ancestors)

---

## API Documentation (Sample Queries/Mutations)

> Add the `X-Org-Slug` header in GraphiQL/Insomnia/Postman.

### 1) List Organizations
```graphql
query Organizations {
  organizations { id name slug contactEmail }
}
```

### 2) Create Organization
```graphql
mutation CreateOrg($name: String!, $contactEmail: String!, $slug: String) {
  createOrganization(name: $name, contactEmail: $contactEmail, slug: $slug) {
    ok
    organization { id name slug contactEmail }
  }
}
```

### 3) List Projects (scoped by org)
```graphql
query Projects {
  projects { id name description status dueDate taskCount completedTasks }
}
```

### 4) Create Project
```graphql
mutation CP($name: String!) {
  createProject(name: $name, status: "ACTIVE") {
    ok
    project { id name status }
  }
}
```

### 5) List Tasks by Project
```graphql
query Tasks($projectId: ID!) {
  tasks(projectId: $projectId) {
    id title status assigneeEmail dueDate description
    comments { id content authorEmail createdAt }
  }
}
```

### 6) Create/Update Task
```graphql
mutation CreateTask($projectId: ID!, $title: String!) {
  createTask(projectId: $projectId, title: $title, status: "TODO") {
    ok
    task { id title status }
  }
}
```
```graphql
mutation UpdateTask($id: ID!) {
  updateTask(id: $id, status: "IN_PROGRESS") {
    ok
    task { id title status }
  }
}
```

### 7) Add Comment
```graphql
mutation AddComment($taskId: ID!, $content: String!, $email: String!) {
  addComment(taskId: $taskId, content: $content, authorEmail: $email) {
    ok
    comment { id content authorEmail createdAt }
  }
}
```

---

## Environment & Configuration

### Django
- `DEBUG=True` for local dev
- `ALLOWED_HOSTS=["*"]` (dev only)
- `STATIC_URL="/static/"`
- **CORS**: add `django-cors-headers` and allow `http://localhost:5173`

Example (settings):
```py
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173"]
```

**PostgreSQL (optional)** — `DATABASES` example:
```py
DATABASES = {
  "default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": "minipm",
    "USER": "minipm",
    "PASSWORD": "minipm",
    "HOST": "127.0.0.1",
    "PORT": "5432",
  }
}
```
Or run Postgres via Docker:
```yaml
# docker-compose.yml (optional)
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: minipm
      POSTGRES_USER: minipm
      POSTGRES_PASSWORD: minipm
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:
```
Then update Django `DATABASES` and run `migrate` again.

### Frontend
- Node **v20** (avoid 22 unless you bump Vite plugin)
- Vite config pinned (`@vitejs/plugin-react@^4`, `vite@^5`)
- Tailwind 3.x

---

## Troubleshooting

- **White screen / blank page**  
  Usually a module error during evaluation. Check DevTools console. For @hello‑pangea/dnd:
  - **Do not** import `DropResult` as a value. Use **type-only** import:
    ```ts
    import type { DropResult } from "@hello-pangea/dnd";
    ```
  - Clear Vite cache if it looks stuck:
    ```bash
    # windows powershell
    Remove-Item -Recurse -Force .\node_modules\.vite
    npm run dev
    ```

- **“Failed to fetch” from frontend**  
  CORS misconfig or server not running on `:8000`. Enable CORS for `http://localhost:5173` and verify `/graphql/` is reachable.

- **Django errors about STATIC_URL/TEMPLATES/ALLOWED_HOSTS**  
  Ensure these are set in settings for dev:
  ```py
  DEBUG = True
  ALLOWED_HOSTS = ["*"]
  STATIC_URL = "/static/"
  TEMPLATES = [{ "BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True, "OPTIONS": { "context_processors": [...] }}]
  ```

- **DnD cursor offset/janky drag**  
  Avoid `backdrop-blur`, `transform`, or `filter` on any ancestors of Draggables/Droppables. Our modal/columns use plain backgrounds to ensure correct positioning.

---

## Future Improvements

- GraphQL **subscriptions** for real-time comments / task status via WebSockets
- **Filtering & search** (assignees, status, due ranges)
- **Pagination** for large projects
- **Role-based access control** (per-org, per-project roles)
- **Comprehensive tests** (unit for resolvers/services + Cypress for UI)
- **CI/CD**: format, lint, test, build, and deploy
- **Perf**: dataloaders for N+1 queries, field-level resolvers
- **Accessibility**: keyboard DnD fallback, ARIA roles, focus management
- **Offline**: optimistic queue + retry

---

Happy shipping! 🚀
