# Architecture & Technical Reference

This document covers the complete architecture of the To Do app, explains every module and component in detail, and teaches the underlying technology concepts so you can learn from this codebase.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Deep-Dive](#2-backend-deep-dive)
   - [database.js — The Data Layer](#21-databasejs--the-data-layer)
   - [index.js — The API Server](#22-indexjs--the-api-server)
   - [seed.js — Development Utility](#23-seedjs--development-utility)
3. [Frontend Deep-Dive](#3-frontend-deep-dive)
   - [App.js — The Application Shell](#31-appjs--the-application-shell)
   - [ThemeContext.js — Global State via Context](#32-themecontextjs--global-state-via-context)
   - [api.js — HTTP Client Layer](#33-apijs--http-client-layer)
   - [GroupList.js — Sidebar Navigation](#34-grouplistjs--sidebar-navigation)
   - [TodoList.js — The Main Content](#35-todolistjs--the-main-content)
   - [AddTodo.js — Task Creation](#36-addtodojs--task-creation)
   - [EditTodo.js — Modal Editing](#37-edittodojs--modal-editing)
   - [Toast.js — Notification System](#38-toastjs--notification-system)
   - [App.css — Design System](#39-appcss--design-system)
4. [Data Flow](#4-data-flow)
5. [Decisions & Trade-offs](#5-decisions--trade-offs)
6. [What Was Removed and Why](#6-what-was-removed-and-why)
7. [What Was Added and Why](#7-what-was-added-and-why)
8. [Concepts Reference](#8-concepts-reference)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser                                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (frontend)                      │    │
│  │                                                              │    │
│  │  ThemeContext ──→ App ──→ GroupList                          │    │
│  │                   │   ──→ AddTodo                            │    │
│  │                   │   ──→ TodoList ──→ TodoCard              │    │
│  │                   │              ──→ EditTodo (modal)        │    │
│  │                   │   ──→ Toast                              │    │
│  │                   │                                          │    │
│  │                   ▼                                          │    │
│  │              api.js (Axios)                                  │    │
│  └──────────────────────┬──────────────────────────────────────┘    │
│                          │ HTTP requests                             │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Express Server (backend)                           │
│                                                                      │
│  Middleware: cors → json parser                                      │
│                                                                      │
│  Routes:                                                             │
│    GET/POST/PUT/DELETE  /api/groups                                  │
│    GET/POST/PUT/DELETE  /api/todos                                   │
│    GET                  /api/health                                  │
│                                                                      │
│  Error handler middleware (catch-all)                                │
│                                                                      │
│                    ▼                                                  │
│              Database class                                          │
│              (Promise-wrapped SQLite)                                │
│                    ▼                                                  │
│              todo.db file                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Production Deployment

```
Internet → Nginx (port 80/443)
               │
               ├── /api/*  → proxy_pass http://127.0.0.1:3001
               │              (Express backend, managed by PM2)
               │
               └── /*      → serve static files from /var/www/todo-app
                              (React production build)
```

Nginx handles HTTPS termination (via Let's Encrypt/Certbot), serves the static React build directly, and proxies API requests to the Express backend. PM2 keeps the backend process alive and restarts it on crashes.

### Data Model

```
┌─────────────┐       ┌──────────────────────────────┐
│   groups     │       │           todos               │
├─────────────┤       ├──────────────────────────────┤
│ id (PK)     │◄──┐   │ id (PK)                      │
│ name (UNQ)  │   │   │ title                         │
│ color       │   └───│ group_id (FK → groups.id)     │
│ created_at  │       │ description                   │
└─────────────┘       │ completed (0/1)               │
                      │ pinned (0/1)                   │
                      │ hidden (0/1)                   │
                      │ created_at                     │
                      │ updated_at                     │
                      └──────────────────────────────┘
```

**Why this schema?**

- `group_id` uses `ON DELETE SET NULL`: if a group is deleted, its todos become ungrouped rather than being deleted. This prevents accidental data loss.
- Boolean fields (`completed`, `pinned`, `hidden`) are stored as integers (0/1) because SQLite has no native boolean type. SQLite stores values as one of five types: NULL, INTEGER, REAL, TEXT, BLOB. When you write `BOOLEAN`, SQLite treats it as INTEGER internally.
- `updated_at` is set to `CURRENT_TIMESTAMP` on every update. This allows sorting by "recently modified" if needed later.
- `name` on groups has a `UNIQUE` constraint to prevent duplicate group names, enforced at the database level (not just application level) as a defense-in-depth measure.

---

## 2. Backend Deep-Dive

### 2.1 database.js — The Data Layer

**Purpose:** Provides a promise-based wrapper around the `sqlite3` library and handles schema initialization.

**Why wrap SQLite in promises?**

The `sqlite3` Node.js library uses callbacks (the older async pattern):

```js
db.get('SELECT * FROM todos', (err, row) => {
  if (err) handleError(err);
  else doSomething(row);
});
```

This quickly leads to "callback hell" when you have sequential operations. By wrapping each method in a Promise, we can use `async/await`:

```js
const row = await db.get('SELECT * FROM todos');
doSomething(row);
```

This reads top-to-bottom like synchronous code but remains non-blocking.

**Key methods:**

| Method | Returns | Purpose |
|--------|---------|---------|
| `connect()` | Promise | Opens the SQLite database file |
| `init()` | Promise | Creates tables if they don't exist, inserts default group |
| `run(sql, params)` | `{ lastID, changes }` | For INSERT/UPDATE/DELETE. `lastID` is the auto-increment ID of the inserted row. `changes` is how many rows were affected. |
| `get(sql, params)` | single row or undefined | For SELECT that returns one row |
| `all(sql, params)` | array of rows | For SELECT that returns multiple rows |
| `close()` | Promise | Closes the database connection |

**PRAGMA statements in init():**

```js
await this.run('PRAGMA journal_mode = WAL');
await this.run('PRAGMA foreign_keys = ON');
```

- **WAL (Write-Ahead Logging):** SQLite's default journal mode is "rollback journal" which blocks readers while writing. WAL allows readers and writers to operate concurrently, improving performance under load. In WAL mode, writes go to a separate WAL file and are periodically merged back (checkpointed).

- **Foreign keys:** SQLite does NOT enforce foreign keys by default (for backwards compatibility). You must explicitly enable them per-connection. Without this, you could insert a todo with `group_id = 999` even if no such group exists.

**Why is init() called from start() and not the constructor?**

Constructors cannot be `async` in JavaScript. The old code called `this.init()` inside the constructor callback, which created a race condition — the database might not be ready when the first request arrives. By making `init()` an explicit async method called before the server starts listening, we guarantee the database is fully initialized before accepting requests.

---

### 2.2 index.js — The API Server

**Purpose:** Defines the REST API endpoints, applies middleware, and starts the HTTP server.

**Middleware chain:**

```
Request → cors() → express.json() → route handler → response
                                          │
                                     (on error)
                                          ▼
                                   error handler middleware
```

**Why `cors()`?**

CORS (Cross-Origin Resource Sharing) is a browser security mechanism. When your frontend at `localhost:5555` makes an API call to `localhost:5757`, the browser considers this a "cross-origin" request (different port = different origin). Without CORS headers, the browser blocks the response.

`cors()` adds response headers like `Access-Control-Allow-Origin: *` that tell the browser "it's okay, allow this request."

**In production, CORS doesn't matter** for this app because Nginx proxies `/api` requests to the backend. From the browser's perspective, both the frontend and API are at `todo.akshaybhatnagar.in` (same origin), so CORS doesn't apply. We keep it enabled for local development where ports differ.

**Why `express.json({ limit: '1mb' })`?**

`express.json()` is middleware that parses incoming request bodies with `Content-Type: application/json`. Without it, `req.body` would be `undefined`.

The `limit: '1mb'` prevents a malicious client from sending a massive JSON payload (e.g., 1GB) that would crash the server by exhausting memory. Express's default limit is 100KB, but 1MB gives reasonable headroom for large todo descriptions.

**Input validation pattern:**

Every mutating endpoint validates its inputs before touching the database:

```js
if (!name || !name.trim()) {
  return res.status(400).json({ error: 'Group name is required' });
}
if (name.trim().length > 50) {
  return res.status(400).json({ error: 'Group name must be 50 characters or less' });
}
```

**Why validate on the server even though the frontend also validates?**

The server is the **trust boundary**. Anyone can bypass the frontend and send requests directly (via curl, Postman, or browser devtools). Server-side validation is the last line of defense. Frontend validation is for UX (fast feedback); backend validation is for security.

**The async route handler pattern:**

```js
app.get('/api/todos', async (req, res, next) => {
  try {
    // ... await database operations ...
    res.json(result);
  } catch (err) {
    next(err);  // passes to error handler middleware
  }
});
```

Each route is wrapped in `try/catch`. If any `await` rejects, the error is passed to `next()`, which triggers the error handler middleware at the bottom of the file. This prevents unhandled promise rejections from crashing the server.

**Why `next(err)` instead of `res.status(500).json(...)` in catch?**

Centralizing error handling in one place (the error middleware) means:
1. Consistent error response format
2. Centralized logging
3. Less code duplication
4. Easy to add error tracking (e.g., Sentry) later

**Group deletion safety:**

```js
const row = await db.get('SELECT COUNT(*) as count FROM todos WHERE group_id = ?', [id]);
if (row.count > 0) {
  return res.status(400).json({ error: `Cannot delete group with ${row.count} todo(s)...` });
}
```

We check for associated todos before deletion. While the schema uses `ON DELETE SET NULL` (which would just ungroup the todos), it's better UX to make the user explicitly handle their todos first.

**Partial updates (PATCH-like behavior on PUT):**

```js
if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
if (completed !== undefined) { updates.push('completed = ?'); params.push(completed ? 1 : 0); }
```

The todo update endpoint only modifies fields that are present in the request body. Sending `{ completed: true }` only changes `completed` without affecting `title` or `description`. This is important because the frontend sends single-field updates for toggles (complete, pin, hide).

**Graceful shutdown:**

```js
process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});
```

When you press Ctrl+C (SIGINT) or when PM2 restarts the process (SIGTERM), we close the database connection cleanly. This ensures SQLite flushes any pending writes and releases file locks. Without this, you risk database corruption on abrupt termination.

---

### 2.3 seed.js — Development Utility

**Purpose:** Populates the database with sample data for development and testing.

Useful when you want to quickly see how the app looks with real data. Run via `npm run seed`.

It clears existing todos (but keeps the "General" group), creates themed groups, and inserts sample todos with randomized completed/pinned/hidden states.

**Why is it a separate file and not part of the main server?**

Separation of concerns. The seed script is a one-off development utility — you run it manually when needed. Bundling it into the server would mean it runs every time the server starts, which could wipe your data in production.

---

## 3. Frontend Deep-Dive

### 3.1 App.js — The Application Shell

**Purpose:** The root component that manages global state (groups, todos, filters) and renders the main layout.

**State management architecture:**

```
App (owns: groups, todos, filters, search, toast)
 ├── GroupList (reads: groups, selectedGroup)
 ├── AddTodo (writes: creates new todo)
 ├── TodoList (reads: todos; writes: update/delete todo)
 │    ├── TodoCard (reads: single todo)
 │    └── EditTodo (writes: updates todo)
 └── Toast (reads: toast state)
```

**Why lift state to App instead of keeping it in each component?**

The previous architecture had `TodoList` managing its own todo state and `App` triggering refetches via a `refreshTodos` counter. This caused problems:
1. Adding a todo in `AddTodo` couldn't directly update `TodoList`'s state — it had to trigger a full API refetch.
2. Multiple components needed to know about todos (for counts, filtering, etc.).
3. No single source of truth for todo data.

By lifting state to `App`, all components work with the same data:
- `AddTodo` calls `onTodoAdded(newTodo)` → App prepends it to the array instantly
- `TodoList` calls `onTodoUpdated(updatedTodo)` → App patches it in the array
- No unnecessary API refetches for state that's already available

**The `useDebounce` hook:**

```js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

When the user types in the search bar, `searchQuery` changes on every keystroke. Without debouncing, we'd fire an API request on every keystroke (e.g., typing "buy groceries" = 12 API calls). The debounce hook waits until the user stops typing for 300ms before updating `debouncedSearch`, which triggers the actual API call.

**How it works internally:**
1. User types "b" → `searchQuery` = "b" → setTimeout starts
2. User types "u" 100ms later → `searchQuery` = "bu" → cleanup function runs (clears previous timeout) → new setTimeout starts
3. User stops typing → 300ms passes → `debouncedSearch` = "bu" → `fetchTodos` runs

The `return () => clearTimeout(timer)` is a **cleanup function** — React runs it before re-running the effect. This is how we cancel the previous timer.

**The `useCallback` pattern:**

```js
const fetchTodos = useCallback(async () => { ... }, [selectedGroup, showHidden, debouncedSearch]);
```

`useCallback` memoizes the function so it only changes when its dependencies change. Without it, `fetchTodos` would be a new function reference on every render, causing the `useEffect` that depends on it to run on every render (infinite loop).

**Why `useEffect` has `fetchTodos` as a dependency:**

```js
useEffect(() => { fetchTodos(); }, [fetchTodos]);
```

React's exhaustive-deps rule requires listing all values used inside the effect. Since `fetchTodos` is a closure over `selectedGroup`, `showHidden`, and `debouncedSearch`, it needs to be in the dependency array. When any of those values change, `useCallback` returns a new function reference, which triggers the effect to re-run.

**Error handling with toast instead of error state:**

The previous version had `setError('Failed to fetch groups.')` which set an error message that was never cleared — once an error appeared, it stayed forever. The toast pattern is better because:
1. Notifications auto-dismiss after 3 seconds
2. They don't block the UI
3. Success and error messages use the same pattern
4. Multiple toasts can appear in sequence

---

### 3.2 ThemeContext.js — Global State via Context

**Purpose:** Provides dark/light theme state to the entire component tree without prop drilling.

**What is React Context?**

Context is React's built-in way to share state across many components without passing props through every level. Without Context, you'd need to pass `isDarkMode` and `toggleTheme` from `App` → `GroupList`, `App` → `TodoList` → `TodoCard`, etc. With Context, any component can access theme state by calling `useTheme()`.

**Pattern: Provider + Hook**

```js
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(/* ... */);
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

`ThemeProvider` wraps the app in `index.js` (via `App.js`). Any descendant can call `useTheme()` to read or toggle the theme.

**Persisting theme to localStorage:**

```js
const [isDarkMode, setIsDarkMode] = useState(() => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
});
```

The initializer function (lazy initialization) runs once on mount:
1. Check `localStorage` for a saved preference
2. If none, check the OS-level dark mode preference via `prefers-color-scheme`
3. The `useEffect` then writes the theme to both `localStorage` and the HTML attribute

**Why was theme not persisted before?**

The previous `ThemeContext` used `useState(false)` — always starting in light mode. This meant every page refresh reset to light mode, which is frustrating for users who prefer dark mode. The fix is simple: read from `localStorage` on init, write to `localStorage` on change.

**Why `data-theme` attribute instead of a CSS class?**

Both work, but `data-theme` is more semantic and avoids name collisions with utility classes. The CSS uses attribute selectors:

```css
[data-theme='dark'] { --bg: #0f172a; }
```

---

### 3.3 api.js — HTTP Client Layer

**Purpose:** Configures Axios and provides typed API functions for groups and todos.

**Why Axios instead of `fetch`?**

| Feature | fetch | Axios |
|---------|-------|-------|
| JSON parsing | Manual (`response.json()`) | Automatic |
| Error handling | Only rejects on network errors | Rejects on 4xx/5xx too (with `response` property) |
| Request timeout | Not built-in | Built-in (`timeout: 10000`) |
| Request interceptors | Not built-in | Built-in |
| Older browser support | Needs polyfill | Works everywhere |

For this app, Axios's automatic JSON parsing and better error handling are the main wins. The `timeout: 10000` (10 seconds) prevents requests from hanging forever if the server is down.

**Why organize as `groupsAPI` and `todosAPI` objects?**

This creates a clean, discoverable API surface:

```js
await groupsAPI.getAll();
await todosAPI.create({ title: 'Buy milk' });
```

Instead of manually constructing URLs and methods everywhere. If the API URL changes, you only update one file.

---

### 3.4 GroupList.js — Sidebar Navigation

**Purpose:** Renders the group list, handles group CRUD, and lets users filter todos by group.

**Key patterns:**

- **Inline form toggle:** The add/edit form appears inside the sidebar (not a modal) for quick editing. This is a UX choice — groups are small, frequent operations that don't need the interruption of a modal.

- **Color picker:** Uses CSS custom properties (`--dot-color`) for the color dots. Each dot is a button that updates form state. The selected color gets a visual indicator (border + scale transform).

- **Todo count:** Each group shows a count badge from the `todo_count` field returned by the API. The `GET /api/groups` endpoint uses a `LEFT JOIN` with `COUNT(t.id)` to compute this in a single query.

- **Hover-to-reveal actions:** Edit and delete buttons are hidden by default and appear on hover. This reduces visual clutter. On mobile (touch devices), they're always visible since hover doesn't exist.

- **Event propagation:** `onClick={(e) => e.stopPropagation()}` on the actions container prevents clicking edit/delete from also triggering group selection.

---

### 3.5 TodoList.js — The Main Content

**Purpose:** Renders the filtered, sorted list of todo cards and handles todo actions.

**Architecture: Presentational + Container split:**

`TodoList` receives `todos` from its parent (App) and handles filtering/sorting locally. This is the "smart component" pattern — it receives data and callbacks via props, applies business logic (filtering, sorting), and renders presentational `TodoCard` components.

`TodoCard` is a **pure presentational component** — it only receives a single todo and callback functions, with no internal state or API calls.

**Client-side filtering:**

```js
let filtered = todos;
if (completionFilter === 'completed') filtered = todos.filter(t => t.completed);
else if (completionFilter === 'active') filtered = todos.filter(t => !t.completed);
```

**Why filter on the client instead of the server?**

The completion filter is a quick toggle that users flip frequently. If we made an API call on every toggle, there'd be a noticeable loading flash. Since the entire todo list for the current view is already loaded (typically < 100 items), client-side filtering is instant and provides better UX.

However, the **hidden** filter and **search** are handled server-side because:
- Hidden filtering is a security boundary — hidden todos shouldn't be sent to the client unless explicitly requested
- Search benefits from server-side processing (SQL `LIKE` is efficient, and we avoid sending all todos to the client just to filter them)

**Sorting logic:**

```js
const sorted = [...filtered].sort((a, b) => {
  if (a.pinned !== b.pinned) return b.pinned - a.pinned;
  return new Date(b.created_at) - new Date(a.created_at);
});
```

Pinned items always appear first. Within each group (pinned/unpinned), items are sorted by creation date (newest first). The `[...filtered]` spread creates a copy because `.sort()` mutates the array in place, and we should never mutate state directly in React.

**Relative time formatting:**

```js
function formatRelativeTime(dateString) {
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  // ...
}
```

"2m ago" is much more scannable than "Mar 4, 2026 3:42 PM". After 7 days, it falls back to absolute dates since "45d ago" is less useful than "Jan 18".

---

### 3.6 AddTodo.js — Task Creation

**Purpose:** An inline form for creating new todos with expandable details.

**Progressive disclosure pattern:**

The form starts as a single input + button. When focused, it expands to show description and group selection. This keeps the default UI clean while making advanced options accessible.

```js
onFocus={() => setExpanded(true)}
```

The `expanded` state resets after successful submission, collapsing the form back to its minimal state.

**Keyboard shortcut (⌘+Enter):**

```js
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    handleSubmit(e);
  }
};
```

Power users expect keyboard shortcuts. `metaKey` is ⌘ on Mac, `ctrlKey` is Ctrl on Windows/Linux. Regular Enter in the title field triggers HTML form submission normally; this shortcut works from any field in the form.

**Optimistic update pattern:**

When a todo is created, `onTodoAdded(response.data)` is called with the server's response. The parent (`App`) immediately prepends it to the `todos` array:

```js
const handleTodoAdded = (newTodo) => {
  setTodos(prev => [newTodo, ...prev]);
  fetchGroups();  // refresh counts
};
```

This makes the new todo appear instantly. The group count refresh happens in the background.

---

### 3.7 EditTodo.js — Modal Editing

**Purpose:** A modal dialog for editing todo title, description, and group.

**Why a modal for editing but not for adding?**

Adding is a frequent, quick action — you type a title and press Enter. A modal would add friction. Editing is less frequent and involves reviewing existing content, which benefits from a focused, overlay UI that temporarily blocks other interactions.

**Backdrop click to close:**

```js
onClick={(e) => e.target === e.currentTarget && onClose()}
```

`e.target` is what was actually clicked. `e.currentTarget` is the element with the handler (the backdrop). This check ensures clicking inside the modal content doesn't close it — only clicking the dark overlay does.

**Controlled form with initial values from `useEffect`:**

```js
useEffect(() => {
  if (todo) {
    setTitle(todo.title || '');
    setDescription(todo.description || '');
    setGroupId(todo.group_id || null);
  }
}, [todo]);
```

When the `todo` prop changes (user clicks edit on a different todo), the form resets to that todo's values. This is the standard React pattern for "editing an existing item."

---

### 3.8 Toast.js — Notification System

**Purpose:** Displays temporary success/error notifications.

**Auto-dismiss with cleanup:**

```js
useEffect(() => {
  const timer = setTimeout(onClose, 3000);
  return () => clearTimeout(timer);
}, [onClose]);
```

The toast auto-closes after 3 seconds. The cleanup function (`clearTimeout`) runs when the component unmounts or when `onClose` changes, preventing the callback from firing on an unmounted component (which would cause a React warning).

**Why a custom Toast instead of `react-toastify`?**

`react-toastify` is excellent for complex notification needs (queuing, positioning, progress bars). For this app, we only need simple success/error messages, so a 15-line component is sufficient. This reduces bundle size and teaches you how toast notifications actually work under the hood.

**If the app grew** and needed stacked notifications, rich content, or persistence, switching to `react-toastify` would make sense.

---

### 3.9 App.css — Design System

**Purpose:** All styling for the application, organized as a design system using CSS custom properties.

**CSS Custom Properties (Variables):**

```css
:root {
  --bg: #f8fafc;
  --primary: #6366f1;
}

[data-theme='dark'] {
  --bg: #0f172a;
  --primary: #818cf8;
}
```

Variables defined in `:root` apply globally. The `[data-theme='dark']` selector overrides them when dark mode is active. Every component references these variables (`background: var(--bg)`), so changing the theme attribute instantly recolors the entire app.

**Why not CSS-in-JS or Tailwind?**

| Approach | Pros | Cons |
|----------|------|------|
| Plain CSS | Zero runtime overhead, universal, easy to learn | No scoping, manual class naming |
| CSS Modules | Scoped styles, no collisions | Build tool dependency, harder to share styles |
| Tailwind | Rapid prototyping, consistent design | HTML gets cluttered, learning curve, build dependency |
| CSS-in-JS | Scoped, dynamic, co-located | Runtime overhead, bundle size, framework-specific |

For a learning project, plain CSS with custom properties provides the clearest mental model. You see exactly what styles apply to what, and the theming system demonstrates a real-world pattern used by major design systems.

**Responsive design strategy:**

```css
@media (max-width: 768px) {
  .main-container { flex-direction: column; }
  .sidebar { width: 100%; max-height: 220px; }
  .todo-actions { opacity: 1; }
}
```

The desktop layout uses a horizontal flex container (sidebar left, content right). Below 768px, it switches to vertical (sidebar on top, content below). The sidebar gets a max-height and scrolls vertically.

Touch devices don't have hover, so `.todo-actions` (the action buttons on each card) are always visible on mobile.

---

## 4. Data Flow

### Creating a Todo

```
User types in AddTodo → clicks "Add"
  │
  ├── AddTodo: POST /api/todos { title, description, group_id }
  │     │
  │     ▼
  │   Backend: validates → INSERT INTO todos → SELECT (with group join) → 201 response
  │     │
  │     ▼
  ├── AddTodo: calls onTodoAdded(response.data)
  │     │
  │     ▼
  ├── App: setTodos(prev => [newTodo, ...prev])  ← instant UI update
  ├── App: fetchGroups()                          ← refreshes todo counts
  └── App: showToast('Todo created')              ← success notification
```

### Toggling a Todo (complete/pin/hide)

```
User clicks check button on TodoCard
  │
  ├── TodoList.handleToggle: PUT /api/todos/:id { completed: !current }
  │     │
  │     ▼
  │   Backend: UPDATE todos SET completed = ? → SELECT → response
  │     │
  │     ▼
  ├── TodoList: calls onTodoUpdated(response.data)
  │     │
  │     ▼
  └── App: patches the todo in the array
```

### Switching Theme

```
User clicks theme toggle
  │
  ├── ThemeContext: setIsDarkMode(!prev)
  │     │
  │     ▼
  ├── useEffect: document.documentElement.setAttribute('data-theme', 'dark')
  ├── useEffect: localStorage.setItem('theme', 'dark')
  │     │
  │     ▼
  └── CSS: [data-theme='dark'] variables activate → entire UI recolors
```

---

## 5. Decisions & Trade-offs

### SQLite vs PostgreSQL

**Chose SQLite because:**
- Zero configuration — no separate database server to install/manage
- Single file (`todo.db`) — easy to backup, move, and understand
- Perfect for single-user or low-concurrency apps
- Included in Node.js ecosystem via `sqlite3` package

**Would switch to PostgreSQL if:**
- Multiple users needed concurrent write access (SQLite locks the entire database during writes)
- The dataset grew beyond ~1GB
- Advanced queries (full-text search, JSON operations) were needed
- The app needed to scale horizontally (multiple backend instances)

### Server-side vs Client-side Filtering

We use a **hybrid** approach:
- **Server-side:** Hidden todos (security), search (efficiency), group filtering (reduces data transfer)
- **Client-side:** Completion status (instant toggle, small dataset)

This balances responsiveness (no loading flash for frequent toggles) with security (hidden data stays on the server).

### `window.confirm()` for Deletions

We use the browser's native confirmation dialog for delete operations instead of a custom modal.

**Why native is fine:**
- Always accessible (keyboard navigation, screen readers)
- Zero code to maintain
- Users recognize it instantly
- Prevents accidental deletion effectively

**When to use a custom dialog:**
- When you need rich content (undo options, batch selection summary)
- When the confirm message needs dynamic/complex formatting
- When your design system requires visual consistency for all dialogs

### Functional Components + Hooks vs Class Components

The entire app uses functional components with hooks. This is the modern React standard (since React 16.8, 2019). Class components are still supported but:
- Hooks are more composable (custom hooks like `useDebounce`)
- Less boilerplate (no `this.setState`, `this.bind`)
- Effects replace `componentDidMount` + `componentDidUpdate` + `componentWillUnmount` with a single `useEffect`
- The React team recommends hooks for all new code

---

## 6. What Was Removed and Why

### PIN System (PinModal, ChangePinModal)

**What it was:** A client-side PIN that "protected" hidden todos. Default PIN was "1234", stored in React state.

**Why removed:**
1. **False sense of security.** The PIN was never sent to the server. Anyone could see hidden todos by opening browser DevTools → Network tab → looking at API responses.
2. **Reset on every page refresh.** Since it was stored in `useState`, refreshing the page reset the PIN to "1234".
3. **Added UI complexity.** Two modal components, state management for PIN verification, and change PIN flow — all for a feature that didn't actually protect anything.

**What replaced it:** The hidden toggle button now directly shows/hides hidden todos. The server-side filtering was fixed so hidden todos are only sent when explicitly requested (`?hidden=true`).

**If real PIN protection was needed:** The PIN would need to be hashed and stored in the database. The server would need to verify it before returning hidden todos. This is essentially implementing authentication, which is out of scope for this app.

### Dead CSS Files (App.css, index.css)

`App.css` contained the default CRA styles (spinning React logo). `index.css` had base font styles. Neither was imported. They were leftovers from running `create-react-app` and never cleaned up.

### reportWebVitals.js

CRA includes this to optionally report performance metrics (LCP, FID, CLS, etc.). It was called without a callback (`reportWebVitals()` instead of `reportWebVitals(console.log)`), so it did nothing. Web Vitals are valuable for production monitoring, but require a reporting endpoint (e.g., Google Analytics). Removed to reduce dead code.

### Broken Test (App.test.js)

The test asserted `screen.getByText(/learn react/i)` — the default CRA test. The app never showed "learn react", so this test always failed. A failing test that was never fixed is worse than no test, because it teaches you to ignore test failures.

### Changelog Markdown Files

Five separate markdown files (`FIXES_APPLIED.md`, `NEW_FEATURES_ADDED.md`, `LATEST_UPDATES.md`, `EDIT_FEATURE_ADDED.md`, `NETWORK_ACCESS.md`) documented incremental changes. These should be tracked via git commit history, not separate files. Each file added clutter and quickly became outdated.

### start.sh / stop.sh

Shell scripts that started/stopped the backend and frontend using `pkill`. These are fragile (might kill unrelated processes) and unnecessary — `npm start` in each directory handles this, and PM2 handles it in production.

---

## 7. What Was Added and Why

### Search

**What:** A search bar in the header that filters todos by title and description.

**Why:** Any list app with more than ~20 items needs search. Without it, users have to scroll through all todos or remember which group they put something in.

**Implementation:** Server-side `LIKE` query with 300ms debounce on the frontend. Debouncing prevents hammering the API on every keystroke.

### Todo Counts per Group

**What:** Each group in the sidebar shows a badge with its todo count.

**Why:** Helps users quickly see which groups have the most items, and confirms that creating/deleting todos is working (the count updates).

**Implementation:** SQL `LEFT JOIN` with `COUNT(t.id)` in the groups endpoint, computed in a single query.

### Toast Notifications

**What:** Brief success/error messages that appear at the bottom-right and auto-dismiss.

**Why:** The previous error handling set `setError()` which displayed a persistent red bar that never went away. Users need feedback on actions (created, deleted, error), but it shouldn't permanently obstruct the UI.

### Theme Persistence

**What:** Dark/light mode preference saved to `localStorage` and respects OS preference on first visit.

**Why:** Users expect their theme choice to persist. Without persistence, switching to dark mode and refreshing the page resets to light mode — a common complaint.

### Input Validation (Backend)

**What:** Length limits, required field checks, group existence verification.

**Why:** Without validation, a malicious client could create todos with empty titles, 10MB descriptions, or reference non-existent groups. Validation at the database layer (constraints) is a safety net, but application-layer validation provides better error messages.

### Keyboard Shortcut (⌘+Enter)

**What:** Submit the add-todo form from any field using ⌘+Enter (Ctrl+Enter on Windows).

**Why:** Power users heavily rely on keyboard shortcuts. This is a standard shortcut for "submit" in many apps (Slack, GitHub, etc.).

### Relative Timestamps

**What:** "2m ago", "3h ago", "5d ago" instead of absolute dates.

**Why:** "2 hours ago" gives immediate context about recency. "Mar 4, 2026 1:42 PM" requires mental math to determine how recent something is.

---

## 8. Concepts Reference

### React Hooks Used

| Hook | Purpose in This App |
|------|---------------------|
| `useState` | Component-local state (todos, groups, form fields, loading flags) |
| `useEffect` | Side effects: API calls, DOM updates (theme attribute), localStorage |
| `useCallback` | Memoize functions to prevent unnecessary re-renders and effect re-runs |
| `useContext` | Consume ThemeContext without prop drilling |
| `createContext` | Create the theme context that `useContext` reads from |

### Key JavaScript Concepts

| Concept | Where Used | What It Does |
|---------|-----------|--------------|
| `async/await` | All API calls, backend routes | Write asynchronous code that reads like synchronous |
| Destructuring | `const { title, description } = req.body` | Extract properties from objects into variables |
| Spread operator | `[...filtered].sort()`, `{ ...todo, completed: true }` | Copy arrays/objects without mutation |
| Optional chaining | `selectedGroup?.id` | Safely access properties that might be undefined |
| Template literals | `` `${diffMin}m ago` `` | Embed expressions in strings |
| Arrow functions | `(t) => t.completed` | Concise function syntax, inherits `this` from parent scope |
| Ternary operator | `isDarkMode ? 'dark' : 'light'` | Inline conditional expression |
| Lazy state init | `useState(() => localStorage.getItem(...))` | Compute initial state once (not on every render) |
| Cleanup functions | `return () => clearTimeout(timer)` in useEffect | Runs before effect re-runs or component unmounts |

### HTTP Status Codes Used

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation error (empty title, too long, etc.) |
| 404 | Not Found | Todo or group with given ID doesn't exist |
| 409 | Conflict | Duplicate group name (UNIQUE constraint) |
| 500 | Internal Server Error | Unexpected database or server error |

### Express Middleware Chain

Middleware functions run in order for every request. Each can:
- Modify `req` or `res`
- Send a response (ending the chain)
- Call `next()` to pass to the next middleware

```
cors()          → Adds CORS headers
express.json()  → Parses JSON body into req.body
route handler   → Your business logic
error handler   → Catches errors from next(err)
```

The error handler has **four** parameters `(err, req, res, next)` — this is how Express distinguishes it from regular middleware (which has three).

---

## File Tree

```
todo-app/
├── backend/
│   ├── database.js        ← Promise-wrapped SQLite + schema init
│   ├── index.js           ← Express API server
│   ├── seed.js            ← Sample data generator
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html     ← HTML shell
│   │   └── manifest.json  ← PWA metadata
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddTodo.js    ← Inline create form
│   │   │   ├── EditTodo.js   ← Modal edit form
│   │   │   ├── GroupList.js  ← Sidebar with groups
│   │   │   ├── TodoList.js   ← Card grid + TodoCard
│   │   │   └── Toast.js      ← Notification component
│   │   ├── context/
│   │   │   └── ThemeContext.js ← Dark/light mode provider
│   │   ├── services/
│   │   │   └── api.js         ← Axios configuration
│   │   ├── styles/
│   │   │   └── App.css        ← Complete design system
│   │   ├── App.js             ← Root component
│   │   └── index.js           ← React entry point
│   ├── .env
│   └── package.json
├── .gitignore
├── ARCHITECTURE.md         ← This document
└── README.md               ← Quick start guide
```
