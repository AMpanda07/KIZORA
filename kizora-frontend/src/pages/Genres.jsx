import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Sparkles, ChevronRight } from 'lucide-react';
import { fetchGenres } from '../services/api';

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchGenres();
        setGenres(list || []);
      } catch (e) {
        console.warn('Failed to load genres', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Browse by Genre
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Explore our vast anime catalogue filtered by your favorite genres
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {genres.map((genre) => (
            <div
              key={genre.id || genre.name}
              onClick={() => navigate(`/browse?genre=${encodeURIComponent(genre.name)}`)}
              className="group flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-hover)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    {genre.name}
                  </h3>
                  {genre.count && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {genre.count.toLocaleString()} Titles
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Genres;
