// Scheduling and priority calculation helpers (No Emojis, Utilitarian Minimalism)

export const URGENCY_CONFIG = {
  overdue: { label: 'Overdue', className: 'urgency-overdue', desc: 'Past deadline' },
  critical: { label: 'Immediate', className: 'urgency-critical', desc: 'Tight deadline, prioritize' },
  high: { label: 'Next Up', className: 'urgency-high', desc: 'Due soon or high effort' },
  medium: { label: 'Scheduled', className: 'urgency-medium', desc: 'On track' },
  low: { label: 'Later', className: 'urgency-low', desc: 'Ample time remaining' },
  none: { label: 'Backlog', className: 'urgency-none', desc: 'No deadline set' },
  done: { label: 'Done', className: 'urgency-done', desc: 'Completed' },
};

export const EFFORT_PRESETS = [
  { label: '30m', value: 0.5 },
  { label: '1h', value: 1.0 },
  { label: '2h', value: 2.0 },
  { label: '4h', value: 4.0 },
  { label: '8h', value: 8.0 },
];

/**
 * Converts an ISO-8601 string from backend (UTC) to a local 'YYYY-MM-DDTHH:mm'
 * string suitable for HTML5 datetime-local inputs without timezone offset shift.
 */
export function toLocalDatetimeInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Converts a local 'YYYY-MM-DDTHH:mm' string back to a valid ISO-8601 string.
 * Gracefully returns null if empty or invalid.
 */
export function toIsoDatetimeString(localVal) {
  if (!localVal || !String(localVal).trim()) return null;
  const d = new Date(localVal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Generate a quick preset local datetime-local string
 */
export function getQuickDatePreset(type) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const format = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (type === '2h') {
    d.setHours(d.getHours() + 2);
    d.setMinutes(0);
    d.setSeconds(0);
    return format(d);
  }
  if (type === 'today_eod') {
    const nowHours = d.getHours();
    if (nowHours >= 18) {
      d.setHours(21, 0, 0, 0);
    } else {
      d.setHours(18, 0, 0, 0);
    }
    return format(d);
  }
  if (type === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return format(d);
  }
  if (type === 'in_2d') {
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return format(d);
  }
  if (type === 'next_week') {
    const day = d.getDay();
    const daysUntilMon = ((8 - day) % 7) || 7;
    d.setDate(d.getDate() + daysUntilMon);
    d.setHours(9, 0, 0, 0);
    return format(d);
  }
  return '';
}

/**
 * Format a due date string into a clean, contextual label with urgency status.
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
      relativeText = `Overdue ${Math.round(absHours * 60)}m`;
    } else if (absHours < 24) {
      relativeText = `Overdue ${Math.round(absHours)}h`;
    } else {
      const days = Math.round(absHours / 24);
      relativeText = `Overdue ${days}d`;
    }
  } else if (diffHours < 2) {
    statusClass = 'due-imminent';
    relativeText = `Due in ${Math.max(1, Math.round(diffHours * 60))}m`;
  } else if (diffHours < 24) {
    statusClass = 'due-today';
    relativeText = `Due today ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffHours < 48) {
    statusClass = 'due-soon';
    relativeText = `Tomorrow ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
