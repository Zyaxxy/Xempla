import React, { useState } from 'react';
import { AssigneeSelect } from './PersonPicker';
import { IconX } from './Icons';

export default function NewTaskForm({
  people,
  defaultAssignee = null,
  initialStatus = 'todo',
  onCreateTask,
  onClose,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState(defaultAssignee || '');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a task title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onCreateTask({
        title: trimmedTitle,
        description: description.trim(),
        status,
        priority,
        assignee: assignee || null,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return (
    <div className="new-task-form-overlay" onClick={onClose}>
      <div
        className="new-task-form-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-heading">Create Task</h3>
            <span className="modal-sub">Add an item to the sprint board</span>
          </div>
          {onClose && (
            <button
              type="button"
              className="icon-btn close-modal-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <IconX size={15} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="new-task-form">
          <div className="form-group">
            <label className="form-label">
              Task Title <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Implement schema migration script"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="textarea-input"
              rows={3}
              placeholder="Provide technical specifications, context, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Assignee</label>
              <AssigneeSelect
                value={assignee}
                onChange={setAssignee}
                people={people}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Column</label>
              <select
                className="select-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="modal-footer">
            <div className="submit-hint">
              <span>Submit with </span>
              <kbd className="keystroke-badge">⌘</kbd>
              <span> + </span>
              <kbd className="keystroke-badge">Enter</kbd>
            </div>
            <div className="modal-actions">
              {onClose && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
