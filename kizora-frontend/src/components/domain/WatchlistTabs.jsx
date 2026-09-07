import React from 'react';

export const WatchlistTabs = ({ statuses, selectedStatus, onSelectStatus }) => {
  return (
    <div className="flex border-b border-kz-border mb-6">
      {statuses.map(status => (
        <button
          key={status}
          onClick={() => onSelectStatus(status)}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            selectedStatus === status
              ? 'border-kz-primary text-kz-primary'
              : 'border-transparent text-kz-muted hover:text-kz-text'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
};
