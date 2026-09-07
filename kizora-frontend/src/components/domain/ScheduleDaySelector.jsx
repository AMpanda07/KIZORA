import React from 'react';

export const ScheduleDaySelector = ({ days, selectedDay, onSelectDay }) => {
  return (
    <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 space-x-2 no-scrollbar">
      {days.map(day => (
        <button
          key={day}
          onClick={() => onSelectDay(day)}
          className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
            selectedDay === day 
              ? 'bg-kz-primary text-white' 
              : 'bg-kz-surface text-kz-muted hover:bg-kz-card hover:text-kz-text'
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
};
