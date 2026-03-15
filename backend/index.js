const express = require('express');
const cors = require('cors');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 5757;
const db = new Database();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Group Routes ──

app.get('/api/groups', async (req, res, next) => {
  try {
    const groups = await db.all(`
      SELECT g.*, COUNT(t.id) as todo_count
      FROM groups g
      LEFT JOIN todos t ON t.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `);
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

app.post('/api/groups', async (req, res, next) => {
  try {
    const { name, color = '#6366f1' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Group name must be 50 characters or less' });
    }

    const result = await db.run(
      'INSERT INTO groups (name, color) VALUES (?, ?)',
      [name.trim(), color]
    );

    res.status(201).json({
      id: result.lastID,
      name: name.trim(),
      color,
      todo_count: 0,
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A group with this name already exists' });
    }
    next(err);
  }
});

app.put('/api/groups/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Group name must be 50 characters or less' });
    }

    const result = await db.run(
      'UPDATE groups SET name = ?, color = ? WHERE id = ?',
      [name.trim(), color, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ id: parseInt(id), name: name.trim(), color });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A group with this name already exists' });
    }
    next(err);
  }
});

app.delete('/api/groups/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const row = await db.get(
      'SELECT COUNT(*) as count FROM todos WHERE group_id = ?',
      [id]
    );

    if (row.count > 0) {
      return res.status(400).json({
        error: `Cannot delete group with ${row.count} todo(s). Move or delete them first.`,
      });
    }

    const result = await db.run('DELETE FROM groups WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
});

// ── Todo Routes ──

app.get('/api/todos', async (req, res, next) => {
  try {
    const { group_id, hidden, search } = req.query;

    let query = `
      SELECT t.*, g.name as group_name, g.color as group_color
      FROM todos t
      LEFT JOIN groups g ON t.group_id = g.id
    `;

    const params = [];
    const conditions = [];

    if (group_id) {
      conditions.push('t.group_id = ?');
      params.push(group_id);
    }

    if (hidden === 'true') {
      conditions.push('t.hidden = 1');
    } else {
      conditions.push('t.hidden = 0');
    }

    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.pinned DESC, t.created_at DESC';

    const todos = await db.all(query, params);
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

app.post('/api/todos', async (req, res, next) => {
  try {
    const { title, description = '', group_id = null } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Todo title is required' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title must be 200 characters or less' });
    }

    if (group_id) {
      const group = await db.get('SELECT id FROM groups WHERE id = ?', [group_id]);
      if (!group) {
        return res.status(400).json({ error: 'Selected group does not exist' });
      }
    }

    const result = await db.run(
      'INSERT INTO todos (title, description, group_id) VALUES (?, ?, ?)',
      [title.trim(), description.trim(), group_id]
    );

    const todo = await db.get(
      `SELECT t.*, g.name as group_name, g.color as group_color
       FROM todos t
       LEFT JOIN groups g ON t.group_id = g.id
       WHERE t.id = ?`,
      [result.lastID]
    );

    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

app.put('/api/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed, pinned, hidden, group_id } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: 'Title must be 200 characters or less' });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(typeof description === 'string' ? description.trim() : '');
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (pinned !== undefined) {
      updates.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }

    if (hidden !== undefined) {
      updates.push('hidden = ?');
      params.push(hidden ? 1 : 0);
    }

    if (group_id !== undefined) {
      if (group_id !== null) {
        const group = await db.get('SELECT id FROM groups WHERE id = ?', [group_id]);
        if (!group) {
          return res.status(400).json({ error: 'Selected group does not exist' });
        }
      }
      updates.push('group_id = ?');
      params.push(group_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db.run(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = await db.get(
      `SELECT t.*, g.name as group_name, g.color as group_color
       FROM todos t
       LEFT JOIN groups g ON t.group_id = g.id
       WHERE t.id = ?`,
      [id]
    );

    res.json(todo);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM todos WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
