import React from 'react';
import TaskCard from './TaskCard';
import { IconCircleTodo, IconCircleProgress, IconCircleCheck, IconPlus } from './Icons';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    IconComponent: IconCircleTodo,
    colorClass: 'col-todo',
    emptyText: 'No pending tasks in queue',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    IconComponent: IconCircleProgress,
    colorClass: 'col-progress',
    emptyText: 'No active tasks underway',
  },
  {
    id: 'done',
    title: 'Done',
    IconComponent: IconCircleCheck,
    colorClass: 'col-done',
    emptyText: 'No completed tasks yet',
  },
];

export default function Board({
  tasks,
  people,
  filterAssignee,
  filterPriority,
  onUpdateTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) {
  // Filter tasks based on active assignee and priority filters
  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee) {
      if (filterAssignee === 'unassigned') {
        if (t.assignee) return false;
      } else if (t.assignee !== filterAssignee) {
        return false;
      }
    }
    if (filterPriority) {
      if ((t.priority || 'medium') !== filterPriority) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="board-grid">
      {COLUMNS.map((col) => {
        const columnTasks = filteredTasks.filter((t) => t.status === col.id);
        const Icon = col.IconComponent;

        return (
          <section key={col.id} className={`board-column ${col.colorClass}`}>
            <header className="column-header">
              <div className="column-title-group">
                <span className="column-icon">
                  <Icon size={16} />
                </span>
                <h3 className="column-heading">{col.title}</h3>
                <span className="column-badge" title={`${columnTasks.length} tasks`}>
                  {columnTasks.length}
                </span>
              </div>
              <button
                type="button"
                className="btn-add-column-task"
                onClick={() => onOpenNewTaskModal(col.id)}
                title={`Add task to ${col.title}`}
                aria-label={`Add task to ${col.title}`}
              >
                <IconPlus size={14} />
              </button>
            </header>

            <div className="column-task-list">
              {columnTasks.length === 0 ? (
                <div className="column-empty-state">
                  <p className="column-empty-text">{col.emptyText}</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenNewTaskModal(col.id)}
                  >
                    <IconPlus size={13} />
                    <span>Create task</span>
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    people={people}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
