import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import Board from './components/Board';
import ScheduleView from './components/ScheduleView';
import NewTaskForm from './components/NewTaskForm';
import Sidebar from './components/Sidebar';
import {
  IconSidebar,
  IconSidebarExpand,
  IconPlus,
  IconSearch,
  IconX,
  IconAlert,
  IconPriorityBars,
  IconGrid,
  IconClock,
} from './components/Icons';

const POLLING_INTERVAL_MS = 3500;
const USER_STORAGE_KEY = 'shared_taskboard_current_user';
const SIDEBAR_STORAGE_KEY = 'xempla_sidebar_collapsed';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState('todo');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'schedule'

  // Sidebar collapsed state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  // Identity: who is currently using this browser window
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem(USER_STORAGE_KEY) || null;
  });

  const isPollingRef = useRef(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const handleSelectCurrentUser = (name) => {
    setCurrentUser(name);
    if (name) {
      localStorage.setItem(USER_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const handleOpenNewTaskModal = useCallback((initialStatus = 'todo') => {
    setNewTaskInitialStatus(initialStatus);
    setIsNewTaskModalOpen(true);
  }, []);

  // Global keyboard shortcuts: '[' to toggle sidebar, 'n' to new task
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === '[' && !isInput) {
        e.preventDefault();
        handleToggleSidebar();
      } else if ((e.key === 'n' || e.key === 'N') && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleOpenNewTaskModal('todo');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleOpenNewTaskModal]);

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

  // Polling loop (every 3.5s)
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

  // Filter tasks by search query as well
  const displayedTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = t.title && t.title.toLowerCase().includes(q);
    const matchDesc = t.description && t.description.toLowerCase().includes(q);
    const matchAssignee = t.assignee && t.assignee.toLowerCase().includes(q);
    return matchTitle || matchDesc || matchAssignee;
  });

  // Compute active view title for breadcrumb
  let activeViewName = 'All Tasks';
  if (filterAssignee === 'unassigned') {
    activeViewName = 'Unassigned';
  } else if (filterAssignee === currentUser && currentUser) {
    activeViewName = 'My Tasks';
  } else if (filterAssignee) {
    activeViewName = `Assignee: ${filterAssignee}`;
  }

  const hasActiveFilters = Boolean(filterAssignee || filterPriority || searchQuery);

  return (
    <div className="workspace-layout">
      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        tasks={tasks}
        people={people}
        currentUser={currentUser}
        onSelectCurrentUser={handleSelectCurrentUser}
        onAddPerson={handleAddPerson}
        filterAssignee={filterAssignee}
        onSelectFilterAssignee={setFilterAssignee}
        filterPriority={filterPriority}
        onSelectFilterPriority={setFilterPriority}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        onOpenNewTaskModal={handleOpenNewTaskModal}
        lastSynced={lastSynced}
        syncError={syncError}
      />

      {/* Main Viewport */}
      <div className="workspace-main">
        {/* Top Navigation Bar */}
        <header className="workspace-header">
          <div className="workspace-header-left">
            <button
              type="button"
              className="topbar-toggle-btn"
              onClick={handleToggleSidebar}
              title={isSidebarCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
              aria-label="Toggle sidebar"
            >
              {isSidebarCollapsed ? <IconSidebarExpand size={16} /> : <IconSidebar size={16} />}
            </button>

            <div className="breadcrumb-nav">
              <span className="breadcrumb-root">Sprint</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {viewMode === 'schedule' ? 'Task Scheduler' : activeViewName}
              </span>
              {viewMode === 'board' && filterPriority && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-tag">
                    <IconPriorityBars priority={filterPriority} size={11} />
                    <span>{filterPriority.toUpperCase()}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="workspace-header-center">
            {/* Quick search input */}
            <div className="search-input-wrap">
              <IconSearch size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <IconX size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="workspace-header-right">
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'board' ? 'view-toggle-active' : ''}`}
                onClick={() => setViewMode('board')}
                title="Kanban Board View"
              >
                <IconGrid size={13} />
                <span>Board</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'schedule' ? 'view-toggle-active' : ''}`}
                onClick={() => setViewMode('schedule')}
                title="Priority Task Scheduler"
              >
                <IconClock size={13} />
                <span>Scheduler</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenNewTaskModal('todo')}
            >
              <IconPlus size={14} />
              <span>New Task</span>
              <kbd className="keystroke-badge">N</kbd>
            </button>
          </div>
        </header>

        {/* Sync Error Notice with clean SVG alert */}
        {syncError && (
          <div className="connection-error-bar">
            <IconAlert size={15} />
            <span>Connection disconnected: {syncError}. Retrying in background...</span>
          </div>
        )}

        {/* Filter Indicator Sub-bar (if filters are active) */}
        {hasActiveFilters && (
          <section className="active-filters-bar">
            <span className="filters-label">Active Filters:</span>
            <div className="filter-chips-list">
              {filterAssignee && (
                <span className="filter-chip">
                  <span>Assignee: {filterAssignee}</span>
                  <button
                    type="button"
                    className="filter-chip-remove"
                    onClick={() => setFilterAssignee('')}
                    aria-label="Remove assignee filter"
                  >
                    <IconX size={11} />
                  </button>
                </span>
              )}
              {filterPriority && (
                <span className="filter-chip">
                  <IconPriorityBars priority={filterPriority} size={11} />
                  <span>Priority: {filterPriority}</span>
                  <button
                    type="button"
                    className="filter-chip-remove"
                    onClick={() => setFilterPriority('')}
                    aria-label="Remove priority filter"
                  >
                    <IconX size={11} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-chip">
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    className="filter-chip-remove"
                    onClick={() => setSearchQuery('')}
                    aria-label="Remove search query"
                  >
                    <IconX size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                className="clear-all-filters-btn"
                onClick={() => {
                  setFilterAssignee('');
                  setFilterPriority('');
                  setSearchQuery('');
                }}
              >
                Clear all
              </button>
            </div>
          </section>
        )}

        {/* Main Area: Board or Scheduler */}
        <main className="board-main">
          {loading && tasks.length === 0 ? (
            <div className="board-loading">
              <div className="spinner" />
              <p className="loading-text">Loading workspace...</p>
            </div>
          ) : viewMode === 'schedule' ? (
            <ScheduleView
              tasks={displayedTasks}
              people={people}
              currentUser={currentUser}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={handleOpenNewTaskModal}
            />
          ) : (
            <Board
              tasks={displayedTasks}
              people={people}
              filterAssignee={filterAssignee}
              filterPriority={filterPriority}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={handleOpenNewTaskModal}
            />
          )}
        </main>
      </div>

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
