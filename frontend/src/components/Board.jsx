import React from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    icon: '📋',
    colorClass: 'col-todo',
    emptyText: 'No tasks to do',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: '⚡',
    colorClass: 'col-progress',
    emptyText: 'No tasks currently in progress',
  },
  {
    id: 'done',
    title: 'Done',
    icon: '✅',
    colorClass: 'col-done',
    emptyText: 'No completed tasks yet',
  },
];

export default function Board({
  tasks,
  people,
  filterAssignee,
  onUpdateTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) {
  // Filter tasks if filter is active
  const filteredTasks = filterAssignee
    ? tasks.filter((t) => {
        if (filterAssignee === 'unassigned') return !t.assignee;
        return t.assignee === filterAssignee;
      })
    : tasks;

  return (
    <div className="board-grid">
      {COLUMNS.map((col) => {
        const columnTasks = filteredTasks.filter((t) => t.status === col.id);

        return (
          <section key={col.id} className={`board-column ${col.colorClass}`}>
            <header className="column-header">
              <div className="column-title-group">
                <span className="column-icon">{col.icon}</span>
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
              >
                +
              </button>
            </header>

            <div className="column-task-list">
              {columnTasks.length === 0 ? (
                <div className="column-empty-state">
                  <p>{col.emptyText}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onOpenNewTaskModal(col.id)}
                  >
                    + Add a task
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
