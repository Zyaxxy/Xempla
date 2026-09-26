import React, { useState } from 'react';
import { PersonAvatar, AssigneeSelect } from './PersonPicker';

const STATUS_CONFIG = {
  todo: { label: 'To Do', className: 'status-todo' },
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  done: { label: 'Done', className: 'status-done' },
};

export default function TaskCard({
  task,
  people,
  onUpdateTask,
  onDeleteTask,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editAssignee, setEditAssignee] = useState(task.assignee || '');
  const [editStatus, setEditStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleQuickStatusChange = async (newStatus) => {
    if (newStatus === task.status) return;
    try {
      await onUpdateTask(task.id, { status: newStatus });
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onUpdateTask(task.id, {
        title: trimmedTitle,
        description: editDesc.trim(),
        assignee: editAssignee || null,
        status: editStatus,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        setIsDeleting(true);
        await onDeleteTask(task.id);
      } catch (err) {
        alert(`Failed to delete task: ${err.message}`);
        setIsDeleting(false);
      }
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (isEditing) {
    return (
      <div className="task-card task-card-editing">
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="text-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="textarea-input"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Task details..."
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Assignee</label>
              <AssigneeSelect
                value={editAssignee}
                onChange={setEditAssignee}
                people={people}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select
                className="select-input"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="card-actions-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditTitle(task.title);
                setEditDesc(task.description || '');
                setEditAssignee(task.assignee || '');
                setEditStatus(task.status);
                setIsEditing(false);
                setError('');
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`task-card task-card-${task.status}`}>
      <div className="card-header">
        <h4 className="task-title" title={task.title}>{task.title}</h4>
        <div className="card-top-actions">
          <button
            type="button"
            className="icon-btn edit-icon-btn"
            onClick={() => setIsEditing(true)}
            title="Edit task"
            aria-label="Edit task"
          >
            ✏️
          </button>
          <button
            type="button"
            className="icon-btn delete-icon-btn"
            onClick={handleDelete}
            title="Delete task"
            aria-label="Delete task"
            disabled={isDeleting}
          >
            🗑️
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="card-footer">
        <div className="card-meta">
          {task.assignee ? (
            <div className="assignee-badge" title={`Assigned to ${task.assignee}`}>
              <PersonAvatar name={task.assignee} size="sm" />
              <span className="assignee-name">{task.assignee}</span>
            </div>
          ) : (
            <span className="unassigned-badge">Unassigned</span>
          )}
          <span className="card-time" title={`Created: ${formatTime(task.created_at)}`}>
            {formatTime(task.updated_at || task.created_at)}
          </span>
        </div>

        <div className="card-controls">
          <div className="quick-move-buttons">
            {task.status === 'todo' && (
              <button
                type="button"
                className="btn-pill btn-pill-progress"
                onClick={() => handleQuickStatusChange('in_progress')}
                title="Move to In Progress"
              >
                Start →
              </button>
            )}
            {task.status === 'in_progress' && (
              <>
                <button
                  type="button"
                  className="btn-pill btn-pill-todo"
                  onClick={() => handleQuickStatusChange('todo')}
                  title="Move back to To Do"
                >
                  ← To Do
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-done"
                  onClick={() => handleQuickStatusChange('done')}
                  title="Mark as Done"
                >
                  Done ✓
                </button>
              </>
            )}
            {task.status === 'done' && (
              <button
                type="button"
                className="btn-pill btn-pill-reopen"
                onClick={() => handleQuickStatusChange('in_progress')}
                title="Reopen task"
              >
                ↺ Reopen
              </button>
            )}
          </div>

          <select
            className="status-dropdown"
            value={task.status}
            onChange={(e) => handleQuickStatusChange(e.target.value)}
            title="Change column"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
}
