import React, { useState } from 'react';
import { todosAPI } from '../services/api';

const AddTodo = ({ groupId, groups = [], onTodoAdded }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    group_id: groupId || null 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    try {
      const newTodo = { 
        title: formData.title,
        description: formData.description,
        group_id: formData.group_id || groupId 
      };
      const response = await todosAPI.create(newTodo);
      onTodoAdded(response.data);
      setFormData({ 
        title: '', 
        description: '', 
        group_id: groupId || null 
      });
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
      <div className="input-group">
        <input
          type="text"
          placeholder="Todo title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="input-group">
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
      {!groupId && groups.length > 0 && (
        <div className="input-group">
          <select
            value={formData.group_id || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              group_id: e.target.value ? parseInt(e.target.value) : null 
            })}
          >
            <option value="">Select Group (Optional)</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn btn-success">
        Add Todo
      </button>
    </form>
  );
};

export default AddTodo;

