const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'todo.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.init();
      }
    });
  }

  init() {
    // Create groups table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#007bff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create todos table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        pinned BOOLEAN DEFAULT 0,
        hidden BOOLEAN DEFAULT 0,
        group_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
      )
    `);

    // Insert default group if none exists
    this.db.get("SELECT COUNT(*) as count FROM groups", (err, row) => {
      if (!err && row.count === 0) {
        this.db.run("INSERT INTO groups (name, color) VALUES ('General', '#007bff')");
      }
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = Database;
