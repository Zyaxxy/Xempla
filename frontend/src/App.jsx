import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import Board from './components/Board';
import NewTaskForm from './components/NewTaskForm';
import PersonPicker from './components/PersonPicker';

const POLLING_INTERVAL_MS = 3500;
const USER_STORAGE_KEY = 'shared_taskboard_current_user';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState('todo');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Identity: who is currently using this browser window
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem(USER_STORAGE_KEY) || null;
  });

  const isPollingRef = useRef(false);

  const handleSelectCurrentUser = (name) => {
    setCurrentUser(name);
    if (name) {
      localStorage.setItem(USER_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  // Fetch both tasks and people
  const fetchData = useCallback(async (isBackground = false) => {
    if (isPollingRef.current && isBackground) return;
    try {
      if (isBackground) isPollingRef.current = true;
      const [fetchedTasks, fetchedPeople] = await Promise.all([
        api.getTasks(),
        api.getPeople(),
      ]);
      setTasks(fetchedTasks);
      setPeople(fetchedPeople);
      setLastSynced(new Date());
      setSyncError(null);
    } catch (err) {
      console.error('Failed to sync data:', err);
      setSyncError(err.message || 'Unable to connect to server');
    } finally {
      if (isBackground) isPollingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling loop (every 3.5s per PRD 5.4: 3-5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(true);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [fetchData]);

  // CRUD actions with immediate re-fetch
  const handleCreateTask = async (taskData) => {
    await api.createTask(taskData);
    await fetchData();
  };

  const handleUpdateTask = async (taskId, updates) => {
    await api.updateTask(taskId, updates);
    await fetchData();
  };

  const handleDeleteTask = async (taskId) => {
    await api.deleteTask(taskId);
    await fetchData();
  };

  const handleAddPerson = async (name) => {
    await api.addPerson(name);
    await fetchData();
  };

  const handleOpenNewTaskModal = (initialStatus = 'todo') => {
    setNewTaskInitialStatus(initialStatus);
    setIsNewTaskModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-group">
            <span className="app-logo-icon">📌</span>
            <div>
              <h1 className="app-title">Shared Task Board</h1>
              <span className="app-subtitle">Real-time collaborative board for your team</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="sync-status-indicator" title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : ''}>
            <span className={`sync-dot ${syncError ? 'sync-dot-error' : 'sync-dot-live'}`} />
            <span className="sync-label">
              {syncError ? 'Sync issue' : 'Live Sync'}
            </span>
            {lastSynced && !syncError && (
              <span className="sync-time">
                {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenNewTaskModal('todo')}
          >
            + New Task
          </button>
        </div>
      </header>

      {/* Sync Error Notice */}
      {syncError && (
        <div className="connection-error-bar">
          ⚠️ Connection lost: {syncError}. Retrying in background...
        </div>
      )}

      {/* User / Member Picker Bar */}
      <section className="identity-bar">
        <PersonPicker
          people={people}
          currentUser={currentUser}
          onSelectCurrentUser={handleSelectCurrentUser}
          onAddPerson={handleAddPerson}
        />
      </section>

      {/* Filter and stats sub-bar */}
      <section className="filter-toolbar">
        <div className="filter-group">
          <span className="filter-label">Filter tasks:</span>
          <button
            type="button"
            className={`filter-btn ${filterAssignee === '' ? 'filter-btn-active' : ''}`}
            onClick={() => setFilterAssignee('')}
          >
            All ({tasks.length})
          </button>
          {currentUser && (
            <button
              type="button"
              className={`filter-btn ${filterAssignee === currentUser ? 'filter-btn-active' : ''}`}
              onClick={() => setFilterAssignee(currentUser)}
            >
              My Tasks ({tasks.filter((t) => t.assignee === currentUser).length})
            </button>
          )}
          <button
            type="button"
            className={`filter-btn ${filterAssignee === 'unassigned' ? 'filter-btn-active' : ''}`}
            onClick={() => setFilterAssignee('unassigned')}
          >
            Unassigned ({tasks.filter((t) => !t.assignee).length})
          </button>

          {people.length > 0 && (
            <select
              className="filter-select"
              value={['', 'unassigned', currentUser].includes(filterAssignee) ? '' : filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">Specific Person...</option>
              {people.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({tasks.filter((t) => t.assignee === p.name).length})
                </option>
              ))}
            </select>
          )}
        </div>

        {filterAssignee && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setFilterAssignee('')}
          >
            Clear Filter ✕
          </button>
        )}
      </section>

      {/* Main Board Content */}
      <main className="board-main">
        {loading && tasks.length === 0 ? (
          <div className="board-loading">
            <div className="spinner" />
            <p>Loading shared board...</p>
          </div>
        ) : (
          <Board
            tasks={tasks}
            people={people}
            filterAssignee={filterAssignee}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewTaskModal={handleOpenNewTaskModal}
          />
        )}
      </main>

      {/* Create Task Modal */}
      {isNewTaskModalOpen && (
        <NewTaskForm
          people={people}
          defaultAssignee={currentUser}
          initialStatus={newTaskInitialStatus}
          onCreateTask={handleCreateTask}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}
    </div>
  );
}
