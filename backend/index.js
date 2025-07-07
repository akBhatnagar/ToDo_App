const express = require('express');
const cors = require('cors');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 5656;
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Get all groups
app.get('/api/groups', (req, res) => {
  db.db.all('SELECT * FROM groups ORDER BY created_at ASC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a new group
app.post('/api/groups', (req, res) => {
  const { name, color = '#007bff' } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  db.db.run(
    'INSERT INTO groups (name, color) VALUES (?, ?)',
    [name, color],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Group name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, color });
    }
  );
});

// Update a group
app.put('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  db.db.run(
    'UPDATE groups SET name = ?, color = ? WHERE id = ?',
    [name, color, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Group name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.json({ id: parseInt(id), name, color });
    }
  );
});

// Delete a group
app.delete('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  
  // First, check if group has todos
  db.db.get(
    'SELECT COUNT(*) as count FROM todos WHERE group_id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete group with existing todos. Move or delete todos first.' 
        });
      }
      
      // Delete the group
      db.db.run('DELETE FROM groups WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Group not found' });
        }
        res.json({ message: 'Group deleted successfully' });
      });
    }
  );
});

// Get all todos
app.get('/api/todos', (req, res) => {
  const { group_id, show_hidden } = req.query;
  
  let query = `
    SELECT t.*, 
           g.name as group_name, 
           g.color as group_color,
           datetime(t.created_at, 'localtime') as formatted_created_at,
           datetime(t.updated_at, 'localtime') as formatted_updated_at
    FROM todos t 
    LEFT JOIN groups g ON t.group_id = g.id
  `;
  
  const params = [];
  const conditions = [];
  
  if (group_id) {
    conditions.push('t.group_id = ?');
    params.push(group_id);
  }
  
  if (show_hidden !== 'true') {
    conditions.push('t.hidden = 0');
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY t.pinned DESC, t.created_at DESC';
  
  db.db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a new todo
app.post('/api/todos', (req, res) => {
  const { title, description, group_id } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Todo title is required' });
  }

  db.db.run(
    'INSERT INTO todos (title, description, group_id) VALUES (?, ?, ?)',
    [title, description, group_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get the created todo with group info
      db.db.get(
        `SELECT t.*, g.name as group_name, g.color as group_color 
         FROM todos t 
         LEFT JOIN groups g ON t.group_id = g.id 
         WHERE t.id = ?`,
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// Update a todo
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, completed, pinned, hidden, group_id } = req.body;
  
  const updates = [];
  const params = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
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
    updates.push('group_id = ?');
    params.push(group_id);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
  
  db.db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Get the updated todo with group info
    db.db.get(
      `SELECT t.*, g.name as group_name, g.color as group_color 
       FROM todos t 
       LEFT JOIN groups g ON t.group_id = g.id 
       WHERE t.id = ?`,
      [id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      }
    );
  });
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  
  db.db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted successfully' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
