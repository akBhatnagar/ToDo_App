# To Do by Akshay

A production-grade todo application built with React and Express, featuring task groups, search, dark mode, and hidden todos.

**Live:** [todo.akshaybhatnagar.in](https://todo.akshaybhatnagar.in)

## Quick Start

```bash
# Backend
cd backend && npm install && npm start    # runs on :5757

# Frontend (separate terminal)
cd frontend && npm install && npm start   # runs on :5555
```

Open [http://localhost:5555](http://localhost:5555).

### Seed Sample Data

```bash
cd backend && npm run seed
```

## Tech Stack

| Layer    | Technology           | Purpose                        |
|----------|----------------------|--------------------------------|
| Frontend | React 19             | UI components and state        |
| Styling  | CSS custom properties| Theming and responsive design  |
| HTTP     | Axios                | API communication              |
| Backend  | Express 5            | REST API server                |
| Database | SQLite               | Persistent data storage        |
| Process  | PM2                  | Production process management  |
| Proxy    | Nginx                | Reverse proxy and static files |

## API Reference

### Groups

| Method | Endpoint          | Description     |
|--------|-------------------|-----------------|
| GET    | `/api/groups`     | List all groups (includes `todo_count`) |
| POST   | `/api/groups`     | Create a group  |
| PUT    | `/api/groups/:id` | Update a group  |
| DELETE | `/api/groups/:id` | Delete a group (must be empty) |

### Todos

| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| GET    | `/api/todos`     | List todos (supports `group_id`, `hidden`, `search` query params) |
| POST   | `/api/todos`     | Create a todo     |
| PUT    | `/api/todos/:id` | Partial update    |
| DELETE | `/api/todos/:id` | Delete a todo     |

### Health

| Method | Endpoint       | Description |
|--------|----------------|-------------|
| GET    | `/api/health`  | Health check |

---

For the detailed architecture document, technology deep-dive, and decision rationale, see [ARCHITECTURE.md](./ARCHITECTURE.md).
