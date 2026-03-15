import { useState } from 'react';

function GroupList({
  groups,
  selectedGroup,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const colors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingGroup) {
        await onEditGroup(editingGroup.id, { name: name.trim(), color });
      } else {
        await onAddGroup({ name: name.trim(), color });
      }
      resetForm();
    } catch {
      // error handled by parent
    }
  };

  const startEdit = (group) => {
    setEditingGroup(group);
    setName(group.name);
    setColor(group.color);
    setShowForm(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGroup(null);
    setName('');
    setColor('#6366f1');
  };

  const totalCount = groups.reduce(
    (sum, g) => sum + (g.todo_count || 0),
    0
  );

  return (
    <div className="group-panel">
      <div className="group-panel-header">
        <h2>Groups</h2>
        <button
          className="icon-btn"
          onClick={() => {
            setShowForm(true);
            setEditingGroup(null);
            setName('');
          }}
          title="Add group"
        >
          +
        </button>
      </div>

      {(showForm || editingGroup) && (
        <form className="group-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            maxLength={50}
          />
          <div className="color-picker">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ '--dot-color': c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="group-form-actions">
            <button type="submit" className="btn-primary btn-sm">
              {editingGroup ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={resetForm}
            >
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
          <div className="group-item-left">
            <span
              className="group-dot"
              style={{ '--dot-color': '#6b7280' }}
            />
            <span className="group-name">All Tasks</span>
          </div>
          <span className="group-count">{totalCount}</span>
        </li>

        {groups.map((group) => (
          <li
            key={group.id}
            className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
            onClick={() => onSelectGroup(group)}
          >
            <div className="group-item-left">
              <span
                className="group-dot"
                style={{ '--dot-color': group.color }}
              />
              <span className="group-name">{group.name}</span>
            </div>
            <div className="group-item-right">
              <span className="group-count">{group.todo_count || 0}</span>
              <div
                className="group-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="icon-btn-sm"
                  onClick={() => startEdit(group)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="icon-btn-sm danger"
                  onClick={() => onDeleteGroup(group.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupList;
