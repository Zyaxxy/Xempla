import React, { useState } from 'react';
import { PersonAvatar } from './PersonPicker';
import { IconCheck, IconUser, IconPlus } from './Icons';

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Product Designer',
  'Product Manager',
  'Tech Lead',
  'QA Engineer',
  'DevOps Engineer',
  'Data Analyst',
];

export default function OnboardingModal({
  people = [],
  onComplete,
}) {
  const [mode, setMode] = useState('new'); // 'new' | 'select'
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedExistingName, setSelectedExistingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'select') {
      if (!selectedExistingName) {
        setError('Please choose your name from the list');
        return;
      }
      const existingPerson = people.find((p) => p.name === selectedExistingName);
      onComplete(existingPerson.name, existingPerson.role || '');
      return;
    }

    const trimmedName = name.trim();
    const trimmedRole = role.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    // Check if duplicate
    const existing = people.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      setError('This name already exists. You can select it below or choose a different name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onComplete(trimmedName, trimmedRole, true); // true = create new
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Brand header */}
        <div className="onboarding-header">
          <div className="onboarding-badge">Welcome to Xempla</div>
          <h2>Set up your profile</h2>
          <p className="onboarding-subtitle">
            Enter your name and role so your team knows who is working on what, and to personalize your task schedule.
          </p>
        </div>

        {/* Existing team switcher if people already exist */}
        {people.length > 0 && (
          <div className="onboarding-mode-switch">
            <button
              type="button"
              className={`mode-btn ${mode === 'new' ? 'mode-btn-active' : ''}`}
              onClick={() => {
                setMode('new');
                setError('');
              }}
            >
              <IconPlus size={13} />
              <span>I'm new here</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'select' ? 'mode-btn-active' : ''}`}
              onClick={() => {
                setMode('select');
                setError('');
              }}
            >
              <IconUser size={13} />
              <span>I'm already on the team ({people.length})</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {mode === 'new' ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  Your Full Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Alex Chen"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Role / Title</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Software Engineer, Designer, Lead..."
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (error) setError('');
                  }}
                />

                {/* Quick suggestions */}
                <div className="role-chips-label">Quick select:</div>
                <div className="role-chips-list">
                  {SUGGESTED_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-chip ${role === r ? 'role-chip-active' : ''}`}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Select your existing profile</label>
              <div className="existing-roster-list">
                {people.map((p) => {
                  const isSelected = selectedExistingName === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      className={`existing-member-card ${isSelected ? 'existing-member-selected' : ''}`}
                      onClick={() => {
                        setSelectedExistingName(p.name);
                        setError('');
                      }}
                    >
                      <PersonAvatar name={p.name} size="md" />
                      <div className="member-info">
                        <span className="member-name">{p.name}</span>
                        {p.role && <span className="member-role">{p.role}</span>}
                      </div>
                      {isSelected && <IconCheck size={16} className="check-icon" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div className="onboarding-actions">
            <button
              type="submit"
              className="btn btn-primary btn-onboarding"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up workspace...' : 'Continue to Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
