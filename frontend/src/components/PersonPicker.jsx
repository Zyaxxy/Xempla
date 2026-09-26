import React, { useState } from 'react';

// Generates a consistent pleasant color for person avatars
export function getAvatarColor(name) {
  if (!name) return '#6b7280';
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function PersonAvatar({ name, size = 'sm' }) {
  if (!name) return null;
  const initial = name.trim().charAt(0).toUpperCase();
  const bg = getAvatarColor(name);
  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'md' ? 'avatar-md' : 'avatar-sm';

  return (
    <div
      className={`person-avatar ${sizeClass}`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initial}
    </div>
  );
}

export function AssigneeSelect({ value, onChange, people, allowUnassigned = true, disabled = false }) {
  return (
    <select
      className="select-input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
    >
      {allowUnassigned && <option value="">Unassigned</option>}
      {people.map((p) => (
        <option key={p.name} value={p.name}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export default function PersonPicker({
  people,
  currentUser,
  onSelectCurrentUser,
  onAddPerson,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Please enter a name');
      return;
    }
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That person is already in the group');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onAddPerson(trimmed);
      onSelectCurrentUser(trimmed);
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      setError(err.message || 'Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="person-picker-container">
      <div className="current-user-box">
        <span className="user-label">You are:</span>
        <div className="user-dropdown-wrapper">
          {currentUser && <PersonAvatar name={currentUser} size="sm" />}
          <select
            className="user-select"
            value={currentUser || ''}
            onChange={(e) => onSelectCurrentUser(e.target.value || null)}
          >
            <option value="">Guest (Select your name)</option>
            {people.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setIsAdding(!isAdding);
            setError('');
          }}
        >
          {isAdding ? 'Cancel' : '+ Add Name'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="add-person-form">
          <input
            type="text"
            className="text-input text-input-sm"
            placeholder="Enter your name..."
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (error) setError('');
            }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Adding...' : 'Join Board'}
          </button>
          {error && <span className="error-text-inline">{error}</span>}
        </form>
      )}

      {people.length > 0 && (
        <div className="members-roster">
          <span className="roster-label">Group ({people.length}):</span>
          <div className="roster-chips">
            {people.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`roster-chip ${currentUser === p.name ? 'roster-chip-active' : ''}`}
                onClick={() => onSelectCurrentUser(p.name)}
                title={`Switch to ${p.name}`}
              >
                <PersonAvatar name={p.name} size="sm" />
                <span>{p.name}</span>
                {currentUser === p.name && <span className="you-indicator">(You)</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
