import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bookmark, Clock, Trash2, Compass } from 'lucide-react';
import { useWatchlist, useWatchHistory } from '../hooks/useStorage';
import AnimeCard from '../components/AnimeCard';

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'watchlist';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { history, clearHistory, removeFromHistory } = useWatchHistory();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            My Library
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your personal watchlist and viewing history
          </p>
        </div>

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] mb-8">
        <button
          onClick={() => handleTabChange('watchlist')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-[var(--accent-primary)] text-[var(--accent-hover)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Watchlist ({watchlist.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[var(--accent-primary)] text-[var(--accent-hover)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>History & Continue Watching ({history.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'watchlist' && (
        <>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {watchlist.map((anime) => (
                <div key={anime._id || anime.malId} className="relative group">
                  <AnimeCard anime={anime} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(anime._id || anime.malId);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] max-w-md mx-auto">
              <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                Your watchlist is empty
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Save your favorite anime titles to access them quickly here.
              </p>
              <button
                onClick={() => navigate('/browse')}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                <Compass className="w-3.5 h-3.5" />
                Browse Anime
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <>
          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item) => (
                <div key={item.episodeId || item.animeId} className="relative group">
                  <AnimeCard
                    anime={{
                      _id: item.animeId,
                      title: item.animeTitle,
                      coverImage: item.poster,
                      episodeNumber: item.episodeNumber,
                      episodeTitle: item.episodeTitle,
                      progress: item.progress,
                      episodeId: item.episodeId,
                    }}
                    variant="continue-watching"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.animeId);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Remove from History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] max-w-md mx-auto">
              <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                No watch history yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Episodes you start watching will automatically appear here with saved progress.
              </p>
              <button
                onClick={() => navigate('/browse')}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                <Compass className="w-3.5 h-3.5" />
                Start Watching
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Library;
