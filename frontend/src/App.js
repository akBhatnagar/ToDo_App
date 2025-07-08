import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { groupsAPI } from './services/api';
import GroupList from './components/GroupList';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import PinModal from './components/PinModal';
import ChangePinModal from './components/ChangePinModal';
import './styles/App.css';

function TodoApp() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [completionFilter, setCompletionFilter] = useState('all'); // 'all', 'completed', 'notCompleted'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTodos, setRefreshTodos] = useState(0);
  const [hiddenPin, setHiddenPin] = useState('1234');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      isDarkMode ? 'dark' : 'light'
    );
  }, [isDarkMode]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupsAPI.getAll();
        setGroups(response.data);
      } catch (err) {
        setError('Failed to fetch groups.');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleAddGroup = async (groupData) => {
    try {
      const response = await groupsAPI.create(groupData);
      setGroups([...groups, response.data]);
    } catch (err) {
      setError('Failed to add group.');
      throw err;
    }
  };

  const handleEditGroup = async (id, groupData) => {
    try {
      const response = await groupsAPI.update(id, groupData);
      setGroups(groups.map(g => g.id === id ? response.data : g));
    } catch (err) {
      setError('Failed to edit group.');
      throw err;
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }
    try {
      await groupsAPI.delete(id);
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
    } catch (err) {
      setError('Failed to delete group.');
    }
  };

  const handleTodoAdded = () => {
    setRefreshTodos(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Todo App</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? '☀️' : '🌙'} 
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      {error && <div className="error">{error}</div>}

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
          <div className="section-title">
            {selectedGroup ? selectedGroup.name : 'All Tasks'}
            <div className="controls">
              <div className="filter-controls">
                <button
                  className={`btn btn-sm ${completionFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCompletionFilter('all')}
                >
                  All
                </button>
                <button
                  className={`btn btn-sm ${completionFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCompletionFilter('completed')}
                >
                  Completed
                </button>
                <button
                  className={`btn btn-sm ${completionFilter === 'notCompleted' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCompletionFilter('notCompleted')}
                >
                  Not Completed
                </button>
              </div>
              <div className="checkbox-group">
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    if (showHidden) {
                      // Hide protected - no PIN needed
                      setShowHidden(false);
                    } else {
                      // Show protected - PIN required
                      setShowPinModal(true);
                    }
                  }}
                >
                  {showHidden ? 'Hide Protected' : 'Show Protected'}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowChangePinModal(true)}
                >
                  Change PIN
                </button>
              </div>
            </div>
          </div>

          <AddTodo
            groupId={selectedGroup?.id}
            groups={groups}
            onTodoAdded={handleTodoAdded}
          />

          <TodoList
            key={`${selectedGroup?.id}-${showHidden}-${completionFilter}-${refreshTodos}`}
            groupId={selectedGroup?.id}
            showHidden={showHidden}
            groups={groups}
            completionFilter={completionFilter}
          />
        </main>
      </div>
      {showPinModal && (
        <PinModal
          onClose={() => setShowPinModal(false)}
          onPinVerified={() => {
            setShowHidden(true);
            setShowPinModal(false);
          }}
          hiddenPin={hiddenPin}
        />
      )}
      {showChangePinModal && (
        <ChangePinModal
          onClose={() => setShowChangePinModal(false)}
          onPinChanged={(newPin) => setHiddenPin(newPin)}
          hiddenPin={hiddenPin}
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
