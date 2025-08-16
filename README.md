# Taskify-lite: A minimal project manager application

> **Scope**: Practical, detailed API docs for local development. Includes multi‑tenancy rules, schema objects, queries/mutations with examples, error patterns, and mappings to Django models & frontend TypeScript interfaces.

- **Backend**: Django 4 · Graphene (GraphQL) · SQLite (local) / PostgreSQL (prod)
- **Frontend**: React 18 · TypeScript · Apollo Client 3
- **Tenancy**: All operations require an **Organization** context via the `X-Org-Slug` HTTP header.

---

## Architecture — Clean Separation & Abstractions

```
repo/
├─ core/ or app modules
│  ├─ models.py                # Organization, Project, Task, TaskComment
│  ├─ schema.py                # Query/Mutation (Graphene)
│  ├─ services/                # small domain functions (create/update)
│  ├─ tenancy/middleware.py    # derive org from X-Org-Slug → request.org
│  └─ tests/
└─ frontend/
   ├─ src/
   │  ├─ apollo.ts             # http link + context (org), error link, cache
   │  ├─ graphql/              # GQL documents (org, project, task)
   │  ├─ ui/                   # small components (Button, Modal, Card, ...)
   │  │  ├─ ProjectDetails.tsx # DnD board + editor & comments
   │  │  └─ ProjectsSimple.tsx # projects grid + modal launcher
   │  └─ App.tsx / main.tsx
   └─ vite.config.ts / tailwind.config.js
```

- **Tenancy at the edge:** A **middleware** reads `X-Org-Slug`, fetches the `Organization`, and attaches it to the **GraphQL context** (`info.context.org`). All resolvers **must** apply `organization=...` filters → guarantees isolation.
- **Services over fat resolvers:** Mutation resolvers call tiny **service** functions (validation, defaults, side‑effects). Easy to unit‑test without GraphQL plumbing.
- **UI composition:** Presentational components (cards, badges, buttons) + containers (projects grid, board). Clear separation between styling and data fetching.

---

## 0) Base URL & Headers

- **Endpoint**: `http://localhost:8000/graphql/` (POST)
- **Headers** (required for org-scoped ops):

```
Content-Type: application/json
X-Org-Slug: <your-org-slug>
```

> The frontend sets `X-Org-Slug` from `localStorage.orgSlug` automatically (see `src/apollo.ts`). In GraphiQL, add this header under **HTTP Headers**.

---

## 1) Scalars, Enums & Conventions

- **IDs**: `ID!` (string). The frontend converts numeric DB ids to **strings** (DnD requires string draggableIds).
- **Dates**: `Date` (YYYY‑MM‑DD), `DateTime` (ISO 8601).
- **Enums**
  - `Project.status`: `ACTIVE | COMPLETED | ON_HOLD`
  - `Task.status`: `TODO | IN_PROGRESS | DONE`
- **Naming**: API fields are **camelCase** (Graphene exposes `contact_email` as `contactEmail`, etc.).

---

## 2) Data Model ↔ GraphQL Type ↔ Frontend Interface

### 2.1 Django Models (core)
```py
class Organization(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    contact_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

class Project(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES)
    assignee_email = models.EmailField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    author_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### 2.2 GraphQL Types (conceptual mapping)
```graphql
type Organization {
  id: ID!
  name: String!
  slug: String!
  contactEmail: String!
  createdAt: DateTime!
}

type Project {
  id: ID!
  organization: Organization!     # always filtered by context org
  name: String!
  description: String
  status: String!
  dueDate: Date
  createdAt: DateTime!
  taskCount: Int!                  # computed field
  completedTasks: Int!             # computed field
}

type Task {
  id: ID!
  project: Project!
  title: String!
  description: String
  status: String!
  assigneeEmail: String
  dueDate: DateTime
  createdAt: DateTime!
  comments: [TaskComment!]!
}

type TaskComment {
  id: ID!
  task: Task!
  content: String!
  authorEmail: String!
  createdAt: DateTime!
}
```

### 2.3 Frontend TypeScript Interfaces (used in UI)
```ts
// Project card / grid
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  taskCount: number;
  completedTasks: number;
  dueDate?: string;
}

// Task card / board
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeEmail: string;
  dueDate?: string;
}
```

> **Consistency**: GraphQL uses camelCase, TS uses camelCase, ORM fields are snake_case. Conversion is handled by Graphene/serializers.

---

## 3) Queries

> All list queries are **implicitly scoped** by `X-Org-Slug`. Results **never** include other organizations’ data.

### 3.1 List Organizations (non‑scoped)
**Query**
```graphql
query Organizations {
  organizations {
    id
    name
    slug
    contactEmail
    createdAt
  }
}
```
**Notes**
- Does not require a specific `X-Org-Slug` (but header is tolerated).
- Use this to let a user pick an org in the UI.

---

### 3.2 List Projects (scoped)
**Query**
```graphql
query Projects {
  projects {
    id
    name
    description
    status
    dueDate
    taskCount
    completedTasks
  }
}
```
**Behavior**
- Returns all projects for the **current org**.
- `taskCount` / `completedTasks` are computed in resolvers (efficiently via annotations or counts).

---

### 3.3 List Tasks by Project (scoped)
**Query**
```graphql
query Tasks($projectId: ID!) {
  tasks(projectId: $projectId) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    createdAt
    comments {
      id
      content
      authorEmail
      createdAt
    }
  }
}
```
**Args**
- `projectId` (ID): must belong to the current org.

**Notes**
- Use for the Kanban board columns (group client‑side by `status`).

---

## 4) Mutations

> All mutations validate the org context and row ownership. On violation, a GraphQL error is returned.

### 4.1 Create Organization (non‑scoped)
**Mutation**
```graphql
mutation CreateOrganization($name: String!, $contactEmail: String!, $slug: String) {
  createOrganization(name: $name, contactEmail: $contactEmail, slug: $slug) {
    ok
    organization { id name slug contactEmail createdAt }
  }
}
```
**Validation**
- `name` non-empty, `contactEmail` valid, `slug` unique (or generated from name).

---

### 4.2 Create Project (scoped)
**Mutation**
```graphql
mutation CreateProject($name: String!, $status: String!, $description: String, $dueDate: Date) {
  createProject(name: $name, status: $status, description: $description, dueDate: $dueDate) {
    ok
    project {
      id
      name
      description
      status
      dueDate
      taskCount
      completedTasks
    }
  }
}
```
**Notes**
- New project is associated with the current org from the header.
- `status` must be one of `ACTIVE|COMPLETED|ON_HOLD`.

---

### 4.3 Create Task (scoped)
**Mutation**
```graphql
mutation CreateTask(
  $projectId: ID!
  $title: String!
  $status: String!
  $description: String
  $assigneeEmail: String
  $dueDate: DateTime
) {
  createTask(
    projectId: $projectId
    title: $title
    status: $status
    description: $description
    assigneeEmail: $assigneeEmail
    dueDate: $dueDate
  ) {
    ok
    task { id title description status assigneeEmail dueDate createdAt }
  }
}
```
**Validation**
- `projectId` must belong to the current org.
- `status` must be `TODO|IN_PROGRESS|DONE`.

---

### 4.4 Update Task (scoped)
**Mutation**
```graphql
mutation UpdateTask(
  $id: ID!
  $title: String
  $status: String
  $description: String
  $assigneeEmail: String
  $dueDate: DateTime
) {
  updateTask(
    id: $id
    title: $title
    status: $status
    description: $description
    assigneeEmail: $assigneeEmail
    dueDate: $dueDate
  ) {
    ok
    task {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      comments { id content authorEmail createdAt }
    }
  }
}
```
**Usage**
- Drag & drop between columns updates `status` with an **optimistic response** in the UI.
- Inline editing modal updates any field and refetches the project’s tasks.

---

### 4.5 Add Comment (scoped)
**Mutation**
```graphql
mutation AddComment($taskId: ID!, $content: String!, $authorEmail: String!) {
  addComment(taskId: $taskId, content: $content, authorEmail: $authorEmail) {
    ok
    comment { id content authorEmail createdAt }
  }
}
```
**Notes**
- `taskId` must belong to a project in the current org.
- Use in the Task Editor modal.

---

## 5) End‑to‑End Flow Examples

### 5.1 `curl` examples (GraphQL over HTTP)

**Create Organization**
```bash
curl -s http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation($n:String!,$e:String!){createOrganization(name:$n,contactEmail:$e){ok organization{ id slug }}}","variables":{"n":"Acme Inc","e":"ops@acme.com"}}'
```

**List Projects (for org)**
```bash
curl -s http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-Org-Slug: acme-inc" \
  -d '{"query":"{ projects { id name status taskCount completedTasks } }"}'
```

**Create Task**
```bash
curl -s http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-Org-Slug: acme-inc" \
  -d '{"query":"mutation($p:ID!,$t:String!){createTask(projectId:$p,title:$t,status:\"TODO\"){ok task{id title status}}}", "variables":{"p":"<PROJECT_ID>","t":"Design login screen"}}'
```

**Update Task (DnD → status)**
```bash
curl -s http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-Org-Slug: acme-inc" \
  -d '{"query":"mutation($id:ID!,$s:String){updateTask(id:$id,status:$s){ok task{id status}}}","variables":{"id":"<TASK_ID>","s":"IN_PROGRESS"}}'
```

---

## 6) Error Handling & Tenancy Guarantees

- Missing/invalid `X-Org-Slug` → GraphQL error: `"Organization not found"` or similar.
- Cross-org access (`projectId` not in current org) → GraphQL error: `"Not found"` / `"Forbidden"`.
- Validation errors (bad enum, invalid email) → GraphQL errors with a readable message.
- Network issues → surfaced by Apollo **networkError**; GraphQL resolver issues → **graphQLErrors**.

> The UI has an error link in Apollo; see console logs for details during development.

---

## 7) Pagination, Filtering & Search (Extensibility)

Current lists are simple arrays. To scale, evolve to:
- **Connections**: `projects(first:Int, after:String)` with `edges/node/pageInfo` (Relay style).
- **Filtering**:
  - `projects(status: [ACTIVE, ON_HOLD])`
  - `tasks(projectId: ID!, status: [TODO, DONE], q: String, assigneeEmail: String, dueBefore: DateTime)`
- **Sorting**:
  - `projects(orderBy: DUE_DATE_ASC | NAME_ASC)`

All additions should preserve multi-tenancy by always scoping with `info.context.org` in resolvers.

---

## 8) Mapping Summary (Cheat Sheet)

| Concept | Django (snake) | GraphQL (camel) | Frontend TS |
|---|---|---|---|
| Org slug | `slug` | `slug` | `string` (localStorage, header) |
| Contact | `contact_email` | `contactEmail` | `string` |
| Due date (project) | `due_date` (Date) | `dueDate: Date` | `string (YYYY-MM-DD)` |
| Due date (task) | `due_date` (DateTime) | `dueDate: DateTime` | `ISO string` |
| Status (project) | `status` | `status` (`ACTIVE|COMPLETED|ON_HOLD`) | union type |
| Status (task) | `status` | `status` (`TODO|IN_PROGRESS|DONE`) | union type |
| Counts | — | `taskCount`, `completedTasks` | numbers on `Project` |

---

## 9) Testing Pointers (Brief)

- Unit test **services** (create/update/transition rules).
- Resolver tests assert **org scoping** (no cross-org leakage).
- Contract tests: run sample GraphQL queries against a test DB.
- UI tests: Cypress → org select → create project → create task → DnD move → edit → comment.

---

## 10) Troubleshooting (Short & Useful)

- **Blank screen/white page** → Usually a module error.
  - Check DevTools console.
  - For DnD types: `import type { DropResult } from "@hello-pangea/dnd"`
  - Clear Vite cache on Windows:
    ```powershell
    Remove-Item -Recurse -Force .\node_modules\.vite
    ```
- **“Failed to fetch”** → CORS or server down. Allow `http://localhost:5173` in Django and ensure `/graphql/` is up.
- **DnD cursor offset** → Remove `backdrop-blur`/`transform` on ancestors; our modal/columns use plain `bg-white`.

---

## 11) Future Enhancements (Shortlist)

- GraphQL **subscriptions** (task/comment live updates)
- **Filtering/search** (status, assignee, date ranges, text)
- **Pagination** on large lists (connections)
- **RBAC** (per‑org roles, per‑project permissions)
- **Tests**: unit (services/resolvers), integration (schema), e2e (Cypress)
- **Observability**: request logging, traces, slow query logs
- **Accessibility**: keyboard DnD fallback, ARIA roles for lists/columns

---

## 12) Why This Design Works

- **Tenancy correctness first** (context‑scoped queries ↔ single header).
- **Predictable API** (typed schema, payload mutations, consistent scalars).
- **Composable UI** (small reusable parts; Apollo manages server state).
- **Smooth UX** (optimistic updates; DnD tuned to avoid CSS pitfalls).
- **Easy to extend** (services layer on backend, components on frontend).

---

**You’re set.** Run both servers, select an organization, create a project, add tasks, and drag them between columns. Happy shipping! 🚀
