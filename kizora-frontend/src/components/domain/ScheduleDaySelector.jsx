import React from 'react';

export const ScheduleDaySelector = ({ days, selectedDay, onSelectDay }) => {
  return (
    <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 space-x-2 no-scrollbar">
      {days.map(day => {
        // Fallback for simple string arrays during transition, but expect objects
        const isObject = typeof day === 'object';
        const dayKey = isObject ? day.weekday : day;
        const displayDay = isObject ? day.dayName : day.substring(0, 3).toUpperCase();
        const displayNumber = isObject ? day.dayNumber : '';
        const isSelected = selectedDay === dayKey;
        const isToday = isObject ? day.isToday : false;

        return (
          <button
            key={dayKey}
            onClick={() => onSelectDay(dayKey)}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded font-medium whitespace-nowrap transition-colors min-w-[4rem] ${
              isSelected 
                ? 'bg-kz-primary text-white' 
                : 'bg-kz-surface text-kz-muted hover:bg-kz-card hover:text-kz-text'
            } ${isToday && !isSelected ? 'border border-kz-primary' : ''}`}
          >
            <span className="text-xs uppercase tracking-wider">{displayDay}</span>
            {displayNumber && <span className="text-lg font-bold">{displayNumber}</span>}
          </button>
        );
      })}
    </div>
  );
};
