import React, { useState } from 'react';
import {
  IconLogo,
  IconSidebar,
  IconSidebarExpand,
  IconPlus,
  IconGrid,
  IconUser,
  IconCircleDotted,
  IconPriorityBars,
  IconCheck,
  IconX,
  IconClock,
} from './Icons';
import { PersonAvatar, getAvatarStyle } from './PersonPicker';

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  tasks,
  people,
  currentUser,
  onSelectCurrentUser,
  onAddPerson,
  filterAssignee,
  onSelectFilterAssignee,
  filterPriority,
  onSelectFilterPriority,
  viewMode = 'board',
  onSelectViewMode,
  onOpenNewTaskModal,
  lastSynced,
  syncError,
}) {
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [personError, setPersonError] = useState('');
  const [isSubmittingPerson, setIsSubmittingPerson] = useState(false);

  // Statistics calculation
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const myTasksCount = currentUser
    ? tasks.filter((t) => t.assignee === currentUser).length
    : 0;
  const unassignedTasksCount = tasks.filter((t) => !t.assignee).length;

  const handleAddPersonSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (!trimmed) {
      setPersonError('Name required');
      return;
    }
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setPersonError('Already exists');
      return;
    }
    try {
      setIsSubmittingPerson(true);
      setPersonError('');
      await onAddPerson(trimmed);
      onSelectCurrentUser(trimmed);
      setNewPersonName('');
      setIsAddingPerson(false);
    } catch (err) {
      setPersonError(err.message || 'Error adding member');
    } finally {
      setIsSubmittingPerson(false);
    }
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'app-sidebar-collapsed' : ''}`}>
      {/* Sidebar Header / Logo */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => onSelectFilterAssignee('')} role="button" tabIndex={0}>
          <div className="sidebar-logo-mark">
            <IconLogo size={18} />
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-title">Xempla</span>
              <span className="sidebar-edition">Workspace</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar (Hotkey: [)' : 'Collapse sidebar (Hotkey: [)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <IconSidebarExpand size={16} /> : <IconSidebar size={16} />}
        </button>
      </div>

      {/* Main Action: New Task */}
      <div className="sidebar-action-wrap">
        <button
          type="button"
          className={`sidebar-cta-btn ${isCollapsed ? 'sidebar-cta-btn-collapsed' : ''}`}
          onClick={() => onOpenNewTaskModal('todo')}
          title="Create New Task (Hotkey: N)"
        >
          <IconPlus size={15} />
          {!isCollapsed && (
            <>
              <span className="sidebar-cta-label">New Task</span>
              <kbd className="keystroke-badge">N</kbd>
            </>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="sidebar-scrollable-content">
        {/* User Identity Section */}
        {!isCollapsed && (
          <div className="sidebar-section sidebar-user-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">Identity</span>
              <button
                type="button"
                className="sidebar-inline-btn"
                onClick={() => {
                  setIsAddingPerson(!isAddingPerson);
                  setPersonError('');
                }}
                title={isAddingPerson ? 'Cancel' : 'Add member'}
              >
                {isAddingPerson ? <IconX size={12} /> : <IconPlus size={12} />}
                <span>{isAddingPerson ? 'Cancel' : 'Member'}</span>
              </button>
            </div>

            <div className="sidebar-user-box">
              <div className="sidebar-user-display">
                {currentUser ? (
                  <PersonAvatar name={currentUser} size="sm" />
                ) : (
                  <div className="avatar-placeholder">
                    <IconUser size={13} />
                  </div>
                )}
                <div className="sidebar-user-select-wrap">
                  <select
                    className="sidebar-user-select"
                    value={currentUser || ''}
                    onChange={(e) => onSelectCurrentUser(e.target.value || null)}
                    aria-label="Select your active name"
                  >
                    <option value="">Guest (Select identity)</option>
                    {people.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {isAddingPerson && (
              <form onSubmit={handleAddPersonSubmit} className="sidebar-add-person-form">
                <input
                  type="text"
                  className="sidebar-input-text"
                  placeholder="New member name..."
                  value={newPersonName}
                  onChange={(e) => {
                    setNewPersonName(e.target.value);
                    if (personError) setPersonError('');
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-xs"
                  disabled={isSubmittingPerson}
                >
                  {isSubmittingPerson ? '...' : 'Add'}
                </button>
                {personError && <span className="sidebar-error-text">{personError}</span>}
              </form>
            )}
          </div>
        )}

        {/* Views Navigation */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Views</span>}
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${viewMode === 'board' && filterAssignee === '' && filterPriority === '' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => {
                if (onSelectViewMode) onSelectViewMode('board');
                onSelectFilterAssignee('');
                onSelectFilterPriority('');
              }}
              title="All Tasks"
            >
              <span className="sidebar-nav-icon"><IconGrid size={15} /></span>
              {!isCollapsed && (
                <>
                  <span className="sidebar-nav-text">All Tasks</span>
                  <span className="sidebar-nav-count">{totalTasks}</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${viewMode === 'schedule' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => {
                if (onSelectViewMode) onSelectViewMode('schedule');
              }}
              title="Individual Task Scheduler"
            >
              <span className="sidebar-nav-icon"><IconClock size={15} /></span>
              {!isCollapsed && (
                <>
                  <span className="sidebar-nav-text">Task Scheduler</span>
                  <span className="sidebar-nav-badge">Smart</span>
                </>
              )}
            </button>

            {currentUser && (
              <button
                type="button"
                className={`sidebar-nav-item ${filterAssignee === currentUser ? 'sidebar-nav-item-active' : ''}`}
                onClick={() => onSelectFilterAssignee(currentUser)}
                title={`My Tasks (${myTasksCount})`}
              >
                <span className="sidebar-nav-icon"><IconUser size={15} /></span>
                {!isCollapsed && (
                  <>
                    <span className="sidebar-nav-text">My Tasks</span>
                    <span className="sidebar-nav-count">{myTasksCount}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className={`sidebar-nav-item ${filterAssignee === 'unassigned' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => onSelectFilterAssignee('unassigned')}
              title={`Unassigned (${unassignedTasksCount})`}
            >
              <span className="sidebar-nav-icon"><IconCircleDotted size={15} /></span>
              {!isCollapsed && (
                <>
                  <span className="sidebar-nav-text">Unassigned</span>
                  <span className="sidebar-nav-count">{unassignedTasksCount}</span>
                </>
              )}
            </button>
          </nav>
        </div>

        {/* Priority Filter */}
        {!isCollapsed && (
          <div className="sidebar-section">
            <span className="sidebar-section-title">Priority</span>
            <div className="sidebar-nav">
              {['urgent', 'high', 'medium', 'low'].map((prio) => {
                const count = tasks.filter((t) => (t.priority || 'medium') === prio).length;
                const isActive = filterPriority === prio;
                const labels = {
                  urgent: 'Urgent',
                  high: 'High',
                  medium: 'Medium',
                  low: 'Low',
                };
                return (
                  <button
                    key={prio}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                    onClick={() => onSelectFilterPriority(isActive ? '' : prio)}
                  >
                    <span className={`priority-indicator-dot priority-${prio}`}>
                      <IconPriorityBars priority={prio} size={12} />
                    </span>
                    <span className="sidebar-nav-text">{labels[prio]}</span>
                    <span className="sidebar-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Members List */}
        {!isCollapsed && people.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">Team ({people.length})</span>
            </div>
            <div className="sidebar-team-list">
              {people.map((person) => {
                const count = tasks.filter((t) => t.assignee === person.name).length;
                const isFiltered = filterAssignee === person.name;
                const isMe = currentUser === person.name;

                return (
                  <button
                    key={person.name}
                    type="button"
                    className={`sidebar-team-item ${isFiltered ? 'sidebar-team-item-active' : ''}`}
                    onClick={() => onSelectFilterAssignee(isFiltered ? '' : person.name)}
                    title={`Filter by ${person.name}`}
                  >
                    <div className="sidebar-team-item-left">
                      <PersonAvatar name={person.name} size="sm" />
                      <span className="sidebar-team-name">{person.name}</span>
                      {isMe && <span className="sidebar-me-tag">You</span>}
                    </div>
                    <span className="sidebar-nav-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Board Progress Metric Bento Card */}
        {!isCollapsed && totalTasks > 0 && (
          <div className="sidebar-section sidebar-metric-box">
            <div className="metric-header">
              <span className="metric-title">Board Progress</span>
              <span className="metric-value">{completionPercentage}%</span>
            </div>
            <div className="metric-bar-track">
              <div
                className="metric-bar-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="metric-breakdown">
              <div className="metric-stat">
                <span className="metric-stat-label">To Do</span>
                <span className="metric-stat-num">{todoTasks}</span>
              </div>
              <div className="metric-stat">
                <span className="metric-stat-label">Progress</span>
                <span className="metric-stat-num">{inProgressTasks}</span>
              </div>
              <div className="metric-stat">
                <span className="metric-stat-label">Done</span>
                <span className="metric-stat-num">{doneTasks}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Live Sync Status */}
      <div className="sidebar-footer">
        <div
          className={`sidebar-sync-box ${syncError ? 'sidebar-sync-error' : ''}`}
          title={
            syncError
              ? `Sync issue: ${syncError}`
              : lastSynced
              ? `Last synced: ${lastSynced.toLocaleTimeString()}`
              : 'Syncing...'
          }
        >
          <span className={`sync-dot ${syncError ? 'sync-dot-error' : 'sync-dot-live'}`} />
          {!isCollapsed && (
            <div className="sidebar-sync-text">
              <span className="sync-status-title">
                {syncError ? 'Sync Issue' : 'Live Sync'}
              </span>
              {lastSynced && !syncError && (
                <span className="sync-time-stamp">
                  {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
