import { useState } from 'react';
import { todosAPI } from '../services/api';

function AddTodo({ groupId, groups = [], onTodoAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupValue, setGroupValue] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await todosAPI.create({
        title: title.trim(),
        description: description.trim(),
        group_id: groupValue ? parseInt(groupValue) : groupId || null,
      });
      onTodoAdded(response.data);
      setTitle('');
      setDescription('');
      setGroupValue('');
      setExpanded(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form
      className="add-todo-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="add-todo-main">
        <input
          type="text"
          className="add-todo-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          required
        />
        <button
          type="submit"
          className="add-todo-btn"
          disabled={!title.trim() || submitting}
        >
          {submitting ? '...' : 'Add'}
        </button>
      </div>

      {expanded && (
        <div className="add-todo-details">
          <textarea
            placeholder="Add a description... (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          {!groupId && groups.length > 0 && (
            <select
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
            >
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <p className="form-hint">Press ⌘+Enter to submit</p>
        </div>
      )}
    </form>
  );
}

export default AddTodo;
