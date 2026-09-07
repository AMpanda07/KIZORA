import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { fetchTrendingAnime } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState(
    DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  );
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchTrendingAnime();
        setAnimeList(list || []);
      } catch (err) {
        console.warn('Failed to load schedule anime', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Split items across the 7 days
  const scheduleData = DAYS.reduce((acc, day, idx) => {
    const filtered = animeList.filter((_, i) => i % 7 === idx);
    acc[day] = filtered.length > 0 ? filtered : animeList.slice(0, 3);
    return acc;
  }, {});

  const currentDayAnime = scheduleData[selectedDay] || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Airing Schedule
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Weekly broadcast timetable for currently airing anime
        </p>
      </div>

      {/* Day Selector Tabs (horizontal scrollable on mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {DAYS.map((day) => {
          const isToday =
            DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <span>{day}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* Airing Anime List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : currentDayAnime.length > 0 ? (
        <div className="flex flex-col gap-3">
          {currentDayAnime.map((anime, idx) => (
            <div
              key={anime._id || anime.malId || idx}
              onClick={() => navigate(`/anime/${anime._id || anime.malId}`)}
              className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <div className="w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
                <img
                  src={anime.coverImage}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                    Airing
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    <span>{['18:00', '19:30', '21:00', '22:30', '23:00'][idx % 5]} JST</span>
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-hover)] transition-colors">
                  {anime.title}
                </h3>

                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                  {anime.genres?.slice(0, 3).join(', ') || 'Action'}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/watch/${anime._id || anime.malId}-ep-1`);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-primary"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-secondary)]">
            No scheduled broadcasts found for {selectedDay}.
          </p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
