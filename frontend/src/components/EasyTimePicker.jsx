import React from 'react';
import { getQuickDatePreset, formatDueDateInfo } from '../utils/scheduler';
import { IconCalendar, IconX } from './Icons';

export default function EasyTimePicker({
  value,
  onChange,
  label = 'Deadline (optional)',
}) {
  const dueInfo = value ? formatDueDateInfo(new Date(value).toISOString()) : null;

  const handlePreset = (type) => {
    const val = getQuickDatePreset(type);
    onChange(val);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="easy-time-picker">
      <div className="easy-time-header">
        <label className="form-label">{label}</label>
        {value && (
          <button
            type="button"
            className="time-picker-clear-btn"
            onClick={handleClear}
            title="Clear deadline"
          >
            <IconX size={11} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="easy-time-input-wrap">
        <IconCalendar size={14} className="easy-time-icon" />
        <input
          type="datetime-local"
          className="text-input easy-time-native-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Quick Presets */}
      <div className="easy-time-presets">
        <button
          type="button"
          className="preset-chip"
          onClick={() => handlePreset('2h')}
        >
          +2h
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => handlePreset('today_eod')}
        >
          Today EOD
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => handlePreset('tomorrow')}
        >
          Tomorrow 9AM
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => handlePreset('in_2d')}
        >
          In 2 Days
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => handlePreset('next_week')}
        >
          Next Week
        </button>
      </div>

      {/* Human-readable due preview */}
      {dueInfo && (
        <div className={`easy-time-preview ${dueInfo.statusClass}`}>
          <span>{dueInfo.relativeText}</span>
        </div>
      )}
    </div>
  );
}
