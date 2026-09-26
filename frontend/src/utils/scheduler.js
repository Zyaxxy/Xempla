// Scheduling and priority calculation helpers

export const URGENCY_CONFIG = {
  overdue: { label: 'Overdue', emoji: '🚨', className: 'urgency-overdue', desc: 'Past deadline' },
  critical: { label: 'Do Now', emoji: '🔥', className: 'urgency-critical', desc: 'Tight deadline, start immediately' },
  high: { label: 'Next Up', emoji: '⚡', className: 'urgency-high', desc: 'Due soon or high effort' },
  medium: { label: 'Scheduled', emoji: '⏳', className: 'urgency-medium', desc: 'On track' },
  low: { label: 'Later', emoji: '☕', className: 'urgency-low', desc: 'Plenty of time' },
  none: { label: 'Backlog', emoji: '📝', className: 'urgency-none', desc: 'No due date set' },
  done: { label: 'Done', emoji: '✅', className: 'urgency-done', desc: 'Completed' },
};

export const EFFORT_PRESETS = [
  { label: '30m', value: 0.5 },
  { label: '1h', value: 1.0 },
  { label: '2h', value: 2.0 },
  { label: '4h', value: 4.0 },
  { label: '8h', value: 8.0 },
];

/**
 * Format a due date string into a friendly, contextual label with urgency status.
 */
export function formatDueDateInfo(dueIsoString) {
  if (!dueIsoString) return null;
  
  const due = new Date(dueIsoString);
  if (isNaN(due.getTime())) return null;

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const isOverdue = diffMs < 0;
  const absHours = Math.abs(diffHours);

  let relativeText = '';
  let statusClass = 'due-future';

  if (isOverdue) {
    statusClass = 'due-overdue';
    if (absHours < 1) {
      relativeText = `Overdue by ${Math.round(absHours * 60)}m`;
    } else if (absHours < 24) {
      relativeText = `Overdue by ${Math.round(absHours)}h`;
    } else {
      const days = Math.round(absHours / 24);
      relativeText = `Overdue by ${days}d`;
    }
  } else if (diffHours < 2) {
    statusClass = 'due-imminent';
    relativeText = `Due in ${Math.max(1, Math.round(diffHours * 60))}m`;
  } else if (diffHours < 24) {
    statusClass = 'due-today';
    relativeText = `Due today at ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffHours < 48) {
    statusClass = 'due-soon';
    relativeText = `Tomorrow at ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    relativeText = `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return {
    formattedDate: due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    relativeText,
    isOverdue,
    diffHours,
    statusClass,
  };
}

/**
 * Format hours nicely, e.g. 0.5 -> "30m", 1 -> "1h", 2.5 -> "2h 30m"
 */
export function formatEffortHours(hours) {
  if (!hours && hours !== 0) return '1h';
  const num = parseFloat(hours);
  if (isNaN(num)) return '1h';
  
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
