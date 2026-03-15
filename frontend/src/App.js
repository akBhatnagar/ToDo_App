import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { groupsAPI, todosAPI } from './services/api';
import GroupList from './components/GroupList';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import Toast from './components/Toast';
import './styles/App.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function TodoApp() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [completionFilter, setCompletionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data);
    } catch {
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchTodos = useCallback(async () => {
    setTodosLoading(true);
    try {
      const params = {};
      if (selectedGroup) params.group_id = selectedGroup.id;
      if (showHidden) params.hidden = 'true';
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await todosAPI.getAll(params);
      setTodos(response.data);
    } catch {
      showToast('Failed to load todos', 'error');
    } finally {
      setTodosLoading(false);
    }
  }, [selectedGroup, showHidden, debouncedSearch, showToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddGroup = async (groupData) => {
    try {
      const response = await groupsAPI.create(groupData);
      setGroups((prev) => [...prev, response.data]);
      showToast('Group created');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create group';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleEditGroup = async (id, groupData) => {
    try {
      const response = await groupsAPI.update(id, groupData);
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...response.data } : g))
      );
      if (selectedGroup?.id === id) {
        setSelectedGroup((prev) => ({ ...prev, ...response.data }));
      }
      showToast('Group updated');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update group';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await groupsAPI.delete(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (selectedGroup?.id === id) setSelectedGroup(null);
      showToast('Group deleted');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete group';
      showToast(msg, 'error');
    }
  };

  const handleTodoAdded = (newTodo) => {
    setTodos((prev) => [newTodo, ...prev]);
    fetchGroups();
    showToast('Todo created');
  };

  const handleTodoUpdated = (updatedTodo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === updatedTodo.id ? updatedTodo : t))
    );
    fetchGroups();
  };

  const handleTodoDeleted = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    fetchGroups();
    showToast('Todo deleted');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>
            To Do <span className="header-accent">by Akshay</span>
          </h1>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <span className="search-icon">&#128269;</span>
            <input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <GroupList
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onAddGroup={handleAddGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </aside>

        <main className="content">
          <div className="content-header">
            <h2 className="content-title">
              {selectedGroup ? selectedGroup.name : 'All Tasks'}
              {!todosLoading && (
                <span className="todo-count">{todos.length}</span>
              )}
            </h2>
            <div className="filters">
              <div className="filter-group">
                {['all', 'completed', 'active'].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-btn ${completionFilter === filter ? 'active' : ''}`}
                    onClick={() => setCompletionFilter(filter)}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter === 'completed'
                        ? 'Done'
                        : 'Active'}
                  </button>
                ))}
              </div>
              <button
                className={`filter-btn standalone ${showHidden ? 'active hidden-active' : ''}`}
                onClick={() => setShowHidden((prev) => !prev)}
              >
                {showHidden ? '🔓 Hidden' : '🔒 Hidden'}
              </button>
            </div>
          </div>

          <AddTodo
            groupId={selectedGroup?.id}
            groups={groups}
            onTodoAdded={handleTodoAdded}
          />

          <TodoList
            todos={todos}
            loading={todosLoading}
            completionFilter={completionFilter}
            groups={groups}
            onTodoUpdated={handleTodoUpdated}
            onTodoDeleted={handleTodoDeleted}
            showToast={showToast}
          />
        </main>
      </div>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TodoApp />
    </ThemeProvider>
  );
}

export default App;
