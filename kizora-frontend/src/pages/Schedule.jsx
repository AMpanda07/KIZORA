import React, { useEffect, useState } from 'react';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { ScheduleDaySelector } from '../components/domain/ScheduleDaySelector';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return DAYS.includes(today) ? today : 'Monday';
  });
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await animeService.getSchedule(selectedDay);
        setSchedule(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedDay]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Release Schedule</h1>
      
      <div className="mb-8">
        <ScheduleDaySelector 
          days={DAYS} 
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
      ) : schedule.length === 0 ? (
        <EmptyState 
          title={`No anime on ${selectedDay}`} 
          description="Check another day for your favorite shows." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedule.map(anime => (
            <AnimeCard key={anime.id} anime={anime} layout="horizontal" />
          ))}
        </div>
      )}
    </div>
  );
};
