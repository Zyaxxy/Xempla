import React, { useState } from 'react';
import { PersonAvatar, AssigneeSelect } from './PersonPicker';
import {
  IconPencil,
  IconTrash,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconRefresh,
  IconPriorityBars,
  IconCalendar,
  IconClock,
} from './Icons';
import {
  URGENCY_CONFIG,
  formatDueDateInfo,
  formatEffortHours,
  EFFORT_PRESETS,
} from '../utils/scheduler';

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
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
  const [editPriority, setEditPriority] = useState(task.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(task.due_date ? task.due_date.substring(0, 16) : '');
  const [editEstimatedHours, setEditEstimatedHours] = useState(task.estimated_hours || 1.0);
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
        priority: editPriority,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        estimated_hours: parseFloat(editEstimatedHours) || 1.0,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
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

  const priorityKey = task.priority || 'medium';
  const urgencyKey = task.urgency_level || 'none';
  const urgencyInfo = URGENCY_CONFIG[urgencyKey] || URGENCY_CONFIG.none;
  const dueInfo = formatDueDateInfo(task.due_date);

  if (isEditing) {
    return (
      <div className="task-card task-card-editing">
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label">Title</label>
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
              placeholder="Task details and context..."
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

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select
                className="select-input"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1.2 }}>
              <label className="form-label">Due Date & Time</label>
              <input
                type="datetime-local"
                className="text-input"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Estimated Effort (Hours)</label>
              <div className="effort-input-row">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="100"
                  className="text-input text-input-effort"
                  value={editEstimatedHours}
                  onChange={(e) => setEditEstimatedHours(e.target.value)}
                />
                <div className="effort-presets">
                  {EFFORT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`preset-chip ${parseFloat(editEstimatedHours) === p.value ? 'preset-chip-active' : ''}`}
                      onClick={() => setEditEstimatedHours(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
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
                setEditPriority(task.priority || 'medium');
                setEditDueDate(task.due_date ? task.due_date.substring(0, 16) : '');
                setEditEstimatedHours(task.estimated_hours || 1.0);
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
        <div className="card-title-group">
          <h4 className="task-title" title={task.title}>{task.title}</h4>
          <div className="card-badges-row">
            {task.status !== 'done' && urgencyKey !== 'none' && (
              <span className={`urgency-badge ${urgencyInfo.className}`} title={urgencyInfo.desc}>
                <span className="urgency-dot" />
                <span>{urgencyInfo.label}</span>
              </span>
            )}
            <span className={`priority-badge priority-badge-${priorityKey}`} title={`Priority: ${PRIORITY_LABELS[priorityKey]}`}>
              <IconPriorityBars priority={priorityKey} size={11} />
              <span className="priority-label">{PRIORITY_LABELS[priorityKey]}</span>
            </span>
          </div>
        </div>

        <div className="card-top-actions">
          <button
            type="button"
            className="icon-btn edit-icon-btn"
            onClick={() => setIsEditing(true)}
            title="Edit task"
            aria-label="Edit task"
          >
            <IconPencil size={13} />
          </button>
          <button
            type="button"
            className="icon-btn delete-icon-btn"
            onClick={handleDelete}
            title="Delete task"
            aria-label="Delete task"
            disabled={isDeleting}
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {(dueInfo || task.estimated_hours) && (
        <div className="card-schedule-info">
          {dueInfo ? (
            <span className={`badge-due ${dueInfo.statusClass}`} title={dueInfo.formattedDate}>
              <IconCalendar size={12} />
              <span>{dueInfo.relativeText}</span>
            </span>
          ) : (
            <span className="badge-no-due">
              <IconCalendar size={12} />
              <span>No deadline</span>
            </span>
          )}
          {task.estimated_hours && (
            <span className="badge-effort" title="Estimated effort">
              <IconClock size={12} />
              <span>{formatEffortHours(task.estimated_hours)}</span>
            </span>
          )}
        </div>
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
                className="btn-action btn-action-progress"
                onClick={() => handleQuickStatusChange('in_progress')}
                title="Move to In Progress"
              >
                <span>Start</span>
                <IconArrowRight size={12} />
              </button>
            )}
            {task.status === 'in_progress' && (
              <>
                <button
                  type="button"
                  className="btn-action btn-action-todo"
                  onClick={() => handleQuickStatusChange('todo')}
                  title="Move back to To Do"
                >
                  <IconArrowLeft size={12} />
                  <span>To Do</span>
                </button>
                <button
                  type="button"
                  className="btn-action btn-action-done"
                  onClick={() => handleQuickStatusChange('done')}
                  title="Mark as Done"
                >
                  <span>Done</span>
                  <IconCheck size={12} />
                </button>
              </>
            )}
            {task.status === 'done' && (
              <button
                type="button"
                className="btn-action btn-action-reopen"
                onClick={() => handleQuickStatusChange('in_progress')}
                title="Reopen task"
              >
                <IconRefresh size={12} />
                <span>Reopen</span>
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
