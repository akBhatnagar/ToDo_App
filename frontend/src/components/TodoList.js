import { useState } from 'react';
import { todosAPI } from '../services/api';
import EditTodo from './EditTodo';

function TodoList({
  todos,
  loading,
  completionFilter,
  groups,
  onTodoUpdated,
  onTodoDeleted,
  showToast,
}) {
  const [editingTodo, setEditingTodo] = useState(null);

  const handleToggle = async (todo, field) => {
    try {
      const response = await todosAPI.update(todo.id, {
        [field]: !todo[field],
      });
      onTodoUpdated(response.data);
    } catch {
      showToast('Failed to update todo', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      await todosAPI.delete(id);
      onTodoDeleted(id);
    } catch {
      showToast('Failed to delete todo', 'error');
    }
  };

  const handleTodoUpdated = (updatedTodo) => {
    onTodoUpdated(updatedTodo);
    setEditingTodo(null);
    showToast('Todo updated');
  };

  let filtered = todos;
  if (completionFilter === 'completed')
    filtered = todos.filter((t) => t.completed);
  else if (completionFilter === 'active')
    filtered = todos.filter((t) => !t.completed);

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <h3>No todos yet</h3>
        <p>Create your first todo above to get started.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🔍</span>
        <h3>No matching todos</h3>
        <p>Try changing your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="todo-grid">
        {sorted.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onEdit={setEditingTodo}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editingTodo && (
        <EditTodo
          todo={editingTodo}
          groups={groups}
          onTodoUpdated={handleTodoUpdated}
          onClose={() => setEditingTodo(null)}
        />
      )}
    </>
  );
}

function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const timeAgo = formatRelativeTime(todo.created_at);

  return (
    <div
      className={`todo-card ${todo.completed ? 'completed' : ''} ${todo.pinned ? 'pinned' : ''}`}
    >
      {!!todo.pinned && <span className="pin-badge">📌</span>}
      {!!todo.hidden && <span className="hidden-badge">🔒</span>}

      <div className="todo-card-body">
        <div className="todo-check-row">
          <button
            className={`check-btn ${todo.completed ? 'checked' : ''}`}
            onClick={() => onToggle(todo, 'completed')}
            title={todo.completed ? 'Mark as active' : 'Mark as done'}
          >
            {todo.completed ? '✓' : ''}
          </button>
          <h3
            className={`todo-title ${todo.completed ? 'completed' : ''}`}
          >
            {todo.title}
          </h3>
        </div>

        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
      </div>

      <div className="todo-card-footer">
        <div className="todo-meta">
          {todo.group_name && (
            <span
              className="todo-group"
              style={{ '--group-color': todo.group_color }}
            >
              {todo.group_name}
            </span>
          )}
          <span className="todo-time">{timeAgo}</span>
        </div>

        <div className="todo-actions">
          <button
            className="action-btn"
            onClick={() => onToggle(todo, 'pinned')}
            title={todo.pinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <button
            className="action-btn"
            onClick={() => onToggle(todo, 'hidden')}
            title={todo.hidden ? 'Unhide' : 'Hide'}
          >
            {todo.hidden ? '👁️' : '🔒'}
          </button>
          <button
            className="action-btn"
            onClick={() => onEdit(todo)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="action-btn danger"
            onClick={() => onDelete(todo.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default TodoList;
