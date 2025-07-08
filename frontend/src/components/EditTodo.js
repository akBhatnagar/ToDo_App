import React, { useState, useEffect } from 'react';
import { todosAPI } from '../services/api';

const EditTodo = ({ todo, groups, onTodoUpdated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        group_id: todo.group_id || null
      });
    }
  }, [todo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await todosAPI.update(todo.id, formData);
      onTodoUpdated(response.data);
      onClose();
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!todo) return null;

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Edit Todo</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              placeholder="Todo title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="edit-group">Group</label>
            <select
              id="edit-group"
              value={formData.group_id || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                group_id: e.target.value ? parseInt(e.target.value) : null 
              })}
              disabled={loading}
            >
              <option value="">No Group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Updating...' : 'Update Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTodo;
