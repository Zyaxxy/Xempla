import React, { useState } from 'react';
import { PersonAvatar } from './PersonPicker';
import {
  URGENCY_CONFIG,
  formatDueDateInfo,
  formatEffortHours,
} from '../utils/scheduler';
import {
  IconArrowRight,
  IconCheck,
  IconRefresh,
  IconArrowLeft,
  IconTrash,
  IconClock,
  IconCalendar,
  IconAlert,
  IconPriorityBars,
  IconCircleCheck,
  IconPlus,
} from './Icons';

export default function ScheduleView({
  tasks,
  people,
  currentUser,
  onUpdateTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) {
  const [selectedPerson, setSelectedPerson] = useState(currentUser || '');

  // Filter tasks for the selected person
  const activePerson = selectedPerson || currentUser;
  const personTasks = tasks.filter((t) => {
    if (!activePerson) return true; // show all if nobody chosen
    return t.assignee === activePerson;
  });

  const pendingTasks = personTasks.filter((t) => t.status !== 'done');
  const completedTasks = personTasks.filter((t) => t.status === 'done');

  // Metrics
  const totalEffortHours = pendingTasks.reduce(
    (sum, t) => sum + (parseFloat(t.estimated_hours) || 1.0),
    0
  );

  const overdueCount = pendingTasks.filter((t) => t.urgency_level === 'overdue').length;
  const dueTodayCount = pendingTasks.filter((t) => {
    const info = formatDueDateInfo(t.due_date);
    return info && (info.statusClass === 'due-today' || info.statusClass === 'due-imminent');
  }).length;

  const topFocusTask = pendingTasks.length > 0 ? pendingTasks[0] : null;

  return (
    <div className="schedule-view">
      {/* Schedule Header & Person Selector */}
      <div className="schedule-header">
        <div className="schedule-header-left">
          <div className="schedule-title-row">
            <IconClock size={20} className="schedule-title-icon" />
            <h2>Task Scheduler</h2>
          </div>
          <p className="schedule-subtitle">
            Dynamic prioritization by deadline proximity, required effort, and base importance.
          </p>
        </div>

        <div className="schedule-person-select">
          <label className="schedule-label">Viewing schedule for:</label>
          <div className="person-select-wrapper">
            {activePerson && <PersonAvatar name={activePerson} size="sm" />}
            <select
              className="select-input select-schedule-user"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            >
              <option value="">All Team Tasks</option>
              {people.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {currentUser === p.name ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="schedule-metrics-grid">
        <div className="metric-card metric-effort">
          <span className="metric-icon">
            <IconClock size={20} />
          </span>
          <div className="metric-body">
            <span className="metric-value">{formatEffortHours(totalEffortHours)}</span>
            <span className="metric-title">Remaining Workload</span>
          </div>
        </div>

        <div className="metric-card metric-focus">
          <span className="metric-icon">
            <IconPriorityBars priority="urgent" size={20} />
          </span>
          <div className="metric-body">
            <span className="metric-value truncate">
              {topFocusTask ? topFocusTask.title : 'All caught up'}
            </span>
            <span className="metric-title">Top Priority Focus</span>
          </div>
        </div>

        <div className={`metric-card ${overdueCount > 0 ? 'metric-alert' : ''}`}>
          <span className="metric-icon">
            <IconAlert size={20} />
          </span>
          <div className="metric-body">
            <span className="metric-value">{overdueCount}</span>
            <span className="metric-title">Overdue Tasks</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">
            <IconCalendar size={20} />
          </span>
          <div className="metric-body">
            <span className="metric-value">{dueTodayCount}</span>
            <span className="metric-title">Due Today</span>
          </div>
        </div>
      </div>

      {/* Priority Queue Section */}
      <div className="schedule-queue-section">
        <div className="section-header">
          <h3>
            Recommended Work Queue <span className="queue-count">({pendingTasks.length})</span>
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onOpenNewTaskModal('todo')}
          >
            <IconPlus size={13} />
            <span>Add Task</span>
          </button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="schedule-empty-state">
            <IconCircleCheck size={32} />
            <h4>No active tasks scheduled</h4>
            <p>You have finished all scheduled tasks for this filter.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenNewTaskModal('todo')}
            >
              <IconPlus size={13} />
              <span>Create New Task</span>
            </button>
          </div>
        ) : (
          <div className="schedule-queue-list">
            {pendingTasks.map((task, index) => {
              const urgencyKey = task.urgency_level || 'none';
              const urgency = URGENCY_CONFIG[urgencyKey] || URGENCY_CONFIG.none;
              const dueInfo = formatDueDateInfo(task.due_date);

              return (
                <div
                  key={task.id}
                  className={`schedule-card ${index === 0 ? 'schedule-card-top' : ''} urgency-border-${urgencyKey}`}
                >
                  <div className="schedule-rank">
                    <span className="rank-num">#{index + 1}</span>
                    {index === 0 && <span className="rank-badge">Focus</span>}
                  </div>

                  <div className="schedule-card-main">
                    <div className="schedule-card-header">
                      <div className="schedule-title-row">
                        {urgencyKey !== 'none' && (
                          <span className={`urgency-badge ${urgency.className}`} title={urgency.desc}>
                            <span className="urgency-dot" />
                            <span>{urgency.label}</span>
                          </span>
                        )}
                        <h4 className="schedule-task-title">{task.title}</h4>
                      </div>

                      <div className="schedule-badges">
                        {dueInfo ? (
                          <span className={`badge-due ${dueInfo.statusClass}`} title={dueInfo.formattedDate}>
                            <IconCalendar size={11} />
                            <span>{dueInfo.relativeText}</span>
                          </span>
                        ) : (
                          <span className="badge-no-due">
                            <IconCalendar size={11} />
                            <span>No deadline</span>
                          </span>
                        )}

                        <span className="badge-effort" title="Estimated effort">
                          <IconClock size={11} />
                          <span>{formatEffortHours(task.estimated_hours)}</span>
                        </span>

                        <span className={`status-pill status-pill-${task.status}`}>
                          {task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="schedule-task-desc">{task.description}</p>
                    )}

                    <div className="schedule-card-footer">
                      <div className="schedule-assignee">
                        {task.assignee ? (
                          <div className="assignee-badge">
                            <PersonAvatar name={task.assignee} size="sm" />
                            <span>{task.assignee}</span>
                          </div>
                        ) : (
                          <span className="unassigned-badge">Unassigned</span>
                        )}
                        <span className="base-priority-tag">
                          Importance: <strong>{task.priority || 'medium'}</strong>
                        </span>
                      </div>

                      <div className="schedule-actions">
                        {task.status === 'todo' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                          >
                            <span>Start Now</span>
                            <IconArrowRight size={12} />
                          </button>
                        )}

                        {task.status === 'in_progress' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => onUpdateTask(task.id, { status: 'todo' })}
                            >
                              <IconArrowLeft size={12} />
                              <span>To Do</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => onUpdateTask(task.id, { status: 'done' })}
                            >
                              <span>Done</span>
                              <IconCheck size={12} />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="icon-btn delete-icon-btn"
                          onClick={() => {
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          title="Delete task"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks section */}
      {completedTasks.length > 0 && (
        <div className="schedule-completed-section">
          <h4>Completed ({completedTasks.length})</h4>
          <div className="completed-chips">
            {completedTasks.map((t) => (
              <div key={t.id} className="completed-chip">
                <span className="completed-title">{t.title}</span>
                <span className="completed-effort">{formatEffortHours(t.estimated_hours)}</span>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => onUpdateTask(t.id, { status: 'in_progress' })}
                  title="Reopen"
                >
                  <IconRefresh size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
