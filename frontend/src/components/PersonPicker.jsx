import React, { useState } from 'react';
import { IconUser, IconPlus } from './Icons';

// Palette of muted, sophisticated tones for avatars in dark theme
const AVATAR_PALETTES = [
  { bg: 'rgba(96, 165, 250, 0.15)', text: '#93C5FD', border: 'rgba(96, 165, 250, 0.3)' },
  { bg: 'rgba(52, 211, 153, 0.15)', text: '#86EFAC', border: 'rgba(52, 211, 153, 0.3)' },
  { bg: 'rgba(167, 139, 250, 0.15)', text: '#C4B5FD', border: 'rgba(167, 139, 250, 0.3)' },
  { bg: 'rgba(251, 191, 36, 0.15)', text: '#FDE68A', border: 'rgba(251, 191, 36, 0.3)' },
  { bg: 'rgba(244, 114, 182, 0.15)', text: '#FBCFE8', border: 'rgba(244, 114, 182, 0.3)' },
  { bg: 'rgba(56, 189, 248, 0.15)', text: '#BAE6FD', border: 'rgba(56, 189, 248, 0.3)' },
  { bg: 'rgba(251, 146, 60, 0.15)', text: '#FED7AA', border: 'rgba(251, 146, 60, 0.3)' },
  { bg: 'rgba(45, 212, 191, 0.15)', text: '#99F6E4', border: 'rgba(45, 212, 191, 0.3)' },
];

export function getAvatarStyle(name) {
  if (!name) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: '#9CA3AF',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  const p = AVATAR_PALETTES[index];
  return {
    backgroundColor: p.bg,
    color: p.text,
    borderColor: p.border,
  };
}

export function PersonAvatar({ name, size = 'sm' }) {
  if (!name) return null;
  const initial = name.trim().charAt(0).toUpperCase();
  const style = getAvatarStyle(name);
  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'md' ? 'avatar-md' : 'avatar-sm';

  return (
    <div
      className={`person-avatar ${sizeClass}`}
      style={style}
      title={name}
      aria-label={`Avatar for ${name}`}
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
        <div className="user-dropdown-wrapper">
          {currentUser ? (
            <PersonAvatar name={currentUser} size="sm" />
          ) : (
            <div className="avatar-placeholder">
              <IconUser size={14} />
            </div>
          )}
          <select
            className="user-select"
            value={currentUser || ''}
            onChange={(e) => onSelectCurrentUser(e.target.value || null)}
            aria-label="Select active user identity"
          >
            <option value="">Guest (Select name)</option>
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
          title={isAdding ? 'Cancel' : 'Add new team member'}
        >
          {isAdding ? 'Cancel' : (
            <>
              <IconPlus size={13} />
              <span>Add Member</span>
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="add-person-form">
          <input
            type="text"
            className="text-input text-input-sm"
            placeholder="Member name..."
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (error) setError('');
            }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Adding...' : 'Join'}
          </button>
          {error && <span className="error-text-inline">{error}</span>}
        </form>
      )}
    </div>
  );
}
