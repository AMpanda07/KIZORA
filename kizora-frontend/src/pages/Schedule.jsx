import React, { useEffect, useState, useMemo } from 'react';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ScheduleDaySelector } from '../components/domain/ScheduleDaySelector';

export const Schedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await animeService.getSchedule(weekOffset);
        if (data && data.success) {
          setScheduleData(data);
          
          // Auto-select today if it's the current week, otherwise Monday
          if (!selectedDay || data.weekOffset !== weekOffset) {
            const today = data.days.find(d => d.isToday);
            setSelectedDay(today ? today.weekday : data.days[0].weekday);
          }
        } else {
          setError('Failed to load schedule data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [weekOffset]); // removed selectedDay from deps because changing day doesn't require fetch

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);

  // Get active day events
  const activeDayEvents = useMemo(() => {
    if (!scheduleData || !selectedDay) return [];
    const day = scheduleData.days.find(d => d.weekday === selectedDay);
    return day ? day.events : [];
  }, [scheduleData, selectedDay]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Release Schedule</h1>
        
        {/* Week Navigation */}
        <div className="flex items-center space-x-4 bg-kz-surface px-4 py-2 rounded-lg">
          <button 
            onClick={handlePrevWeek}
            className="p-2 text-kz-muted hover:text-white transition-colors hover:bg-kz-card rounded"
            aria-label="Previous Week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="text-sm font-medium">
            {weekOffset === 0 ? 'Current Week' : 
             weekOffset === -1 ? 'Last Week' : 
             weekOffset === 1 ? 'Next Week' : 
             `${Math.abs(weekOffset)} Weeks ${weekOffset > 0 ? 'Ahead' : 'Ago'}`}
          </div>
          
          <button 
            onClick={handleNextWeek}
            className="p-2 text-kz-muted hover:text-white transition-colors hover:bg-kz-card rounded"
            aria-label="Next Week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="mb-8">
        <ScheduleDaySelector 
          days={scheduleData ? scheduleData.days : []} 
          selectedDay={selectedDay} 
          onSelectDay={setSelectedDay} 
        />
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : activeDayEvents.length === 0 ? (
        <EmptyState 
          title={`No anime on ${selectedDay}`} 
          description="Check another day for your favorite shows." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDayEvents.map(anime => (
            <AnimeCard key={anime.id} anime={anime} layout="horizontal" />
          ))}
        </div>
      )}
    </div>
  );
};
