import React, { useState } from 'react';

const GroupList = ({ 
  groups, 
  selectedGroup, 
  onSelectGroup, 
  onAddGroup, 
  onEditGroup, 
  onDeleteGroup 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#007bff' });

  const colors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
    '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#343a40'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await onEditGroup(editingGroup.id, formData);
        setEditingGroup(null);
      } else {
        await onAddGroup(formData);
        setShowAddForm(false);
      }
      setFormData({ name: '', color: '#007bff' });
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, color: group.color });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingGroup(null);
    setFormData({ name: '', color: '#007bff' });
  };

  return (
    <div>
      <div className="section-title">
        Groups
        <button 
          className="btn btn-sm"
          onClick={() => setShowAddForm(true)}
        >
          + Add
        </button>
      </div>

      {(showAddForm || editingGroup) && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Group name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid white' : '1px solid #ccc',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: formData.color === color ? '0 0 0 2px #007bff' : 'none'
                  }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-sm btn-success">
              {editingGroup ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="group-list">
        <li 
          className={`group-item ${!selectedGroup ? 'active' : ''}`}
          onClick={() => onSelectGroup(null)}
        >
          <span>
            <span className="group-color" style={{ backgroundColor: '#6c757d' }}></span>
            All Tasks
          </span>
        </li>
        {groups.map(group => (
          <li 
            key={group.id}
            className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
            onClick={() => onSelectGroup(group)}
          >
            <span>
              <span className="group-color" style={{ backgroundColor: group.color }}></span>
              {group.name}
            </span>
            <div className="group-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => handleEdit(group)}
              >
                ✏️
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => onDeleteGroup(group.id)}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupList;
