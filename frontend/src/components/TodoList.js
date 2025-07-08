import React, { useState, useEffect } from 'react';
import { todosAPI } from '../services/api';
import EditTodo from './EditTodo';

const TodoList = ({ groupId, showHidden, groups = [], completionFilter = 'all' }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      try {
        // Always fetch all todos, then filter client-side for better control
        const params = { group_id: groupId, show_hidden: 'true' };
        const response = await todosAPI.getAll(params);
        setTodos(response.data);
      } catch (err) {
        setError('Failed to fetch todos.');
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, [groupId, showHidden]);

  const toggleComplete = async (id, completed) => {
    try {
      await todosAPI.update(id, { completed: !completed });
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, completed: !completed };
          }
          return todo;
        })
      );
    } catch (err) {
      setError('Failed to update todo.');
    }
  };

  const togglePin = async (id, pinned) => {
    try {
      await todosAPI.update(id, { pinned: !pinned });
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, pinned: !pinned };
          }
          return todo;
        })
      );
    } catch (err) {
      setError('Failed to update todo.');
    }
  };

  const toggleHidden = async (id, hidden) => {
    try {
      await todosAPI.update(id, { hidden: !hidden });
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, hidden: !hidden };
          }
          return todo;
        })
      );
    } catch (err) {
      setError('Failed to update todo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) {
      return;
    }
    try {
      await todosAPI.delete(id);
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo.');
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
  };

  const handleTodoUpdated = (updatedTodo) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === updatedTodo.id ? updatedTodo : todo
      )
    );
  };

  const handleCloseEdit = () => {
    setEditingTodo(null);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Filter todos based on hidden status first
  const hiddenFilteredTodos = todos.filter((todo) => {
    if (showHidden) {
      // Show only hidden todos when in protected mode
      return todo.hidden;
    } else {
      // Show only non-hidden todos in normal mode
      return !todo.hidden;
    }
  });

  // Then filter based on completion status
  const filteredTodos = hiddenFilteredTodos.filter((todo) => {
    if (completionFilter === 'completed') {
      return todo.completed;
    } else if (completionFilter === 'notCompleted') {
      return !todo.completed;
    }
    return true; // 'all'
  });

  // Sort todos: pinned first (by created_at DESC), then non-pinned (by created_at DESC)
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // First, sort by pinned status (pinned items first)
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // If both have same pinned status, sort by created_at (newest first)
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB - dateA;
  });

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (filteredTodos.length === 0 && hiddenFilteredTodos.length > 0) {
    return (
      <div className="empty-state">
        <h3>No todos match your completion filter</h3>
        <p>Try selecting a different completion status filter.</p>
      </div>
    );
  }

  if (hiddenFilteredTodos.length === 0 && todos.length > 0) {
    return (
      <div className="empty-state">
        <h3>{showHidden ? 'No hidden todos found' : 'No visible todos found'}</h3>
        <p>{showHidden ? 'You don\'t have any hidden todos yet.' : 'All your todos might be hidden. Try accessing protected mode.'}</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <h3>No todos found</h3>
        <p>Create your first todo using the form above!</p>
      </div>
    );
  }

  return (
    <div className="todo-grid">
      {sortedTodos.map((todo) => (
        <div
          className={`todo-card ${todo.completed ? 'completed' : ''} ${
            todo.pinned ? 'pinned' : ''
          }`}
          key={todo.id}
        >
          <div className="todo-header">
            <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>{todo.title}</h3>
            <div className="todo-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => toggleComplete(todo.id, todo.completed)}
              >
                {todo.completed ? 'Undo' : 'Complete'}
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => togglePin(todo.id, todo.pinned)}
              >
                {todo.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleEdit(todo)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => toggleHidden(todo.id, todo.hidden)}
              >
                {todo.hidden ? 'Unhide' : 'Hide'}
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(todo.id)}
              >
                Delete
              </button>
            </div>
          </div>
          <p className="todo-description">{todo.description}</p>
          <div className="todo-footer">
            <div className="todo-meta">
              <span className="todo-group" style={{ color: todo.group_color }}>
                {todo.group_name}
              </span>
              <span className="todo-timestamp">
                {formatTimestamp(todo.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {editingTodo && (
        <EditTodo
          todo={editingTodo}
          groups={groups}
          onTodoUpdated={handleTodoUpdated}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

export default TodoList;

