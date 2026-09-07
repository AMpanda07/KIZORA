import React, { useState } from 'react';
import { User, Bookmark, Clock, Film, Calendar, ShieldCheck } from 'lucide-react';
import { useWatchlist, useWatchHistory } from '../hooks/useStorage';
import AnimeCard from '../components/AnimeCard';

const Profile = () => {
  const { watchlist } = useWatchlist();
  const { history } = useWatchHistory();
  const [activeTab, setActiveTab] = useState('overview');

  const uniqueAnimeWatched = new Set(history.map((h) => h.animeId)).size;
  const totalEpisodesWatched = history.length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* ── Profile Header ────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-hover)] shadow-lg flex-shrink-0">
          <User className="w-10 h-10" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            KIZORA Viewer
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Active Member &bull; Local Profile</span>
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 max-w-md">
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="block text-lg font-bold text-[var(--text-primary)]">
                {uniqueAnimeWatched}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Anime Watched
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="block text-lg font-bold text-[var(--text-primary)]">
                {totalEpisodesWatched}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Episodes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="block text-lg font-bold text-[var(--text-primary)]">
                {watchlist.length}
              </span>
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Watchlist
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[var(--accent-primary)] text-[var(--accent-hover)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-[var(--accent-primary)] text-[var(--accent-hover)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[var(--accent-primary)] text-[var(--accent-hover)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          History ({history.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              Recently Watched
            </h3>
            {history.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {history.slice(0, 4).map((item) => (
                  <AnimeCard
                    key={item.episodeId || item.animeId}
                    anime={{
                      _id: item.animeId,
                      title: item.animeTitle,
                      coverImage: item.poster,
                      episodeNumber: item.episodeNumber,
                      progress: item.progress,
                      episodeId: item.episodeId,
                    }}
                    variant="continue-watching"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No watch activity yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              Saved in Watchlist
            </h3>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watchlist.slice(0, 4).map((anime) => (
                  <AnimeCard key={anime._id || anime.malId} anime={anime} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No titles in watchlist.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((anime) => (
                <AnimeCard key={anime._id || anime.malId} anime={anime} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Watchlist is empty.</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item) => (
                <AnimeCard
                  key={item.episodeId || item.animeId}
                  anime={{
                    _id: item.animeId,
                    title: item.animeTitle,
                    coverImage: item.poster,
                    episodeNumber: item.episodeNumber,
                    progress: item.progress,
                    episodeId: item.episodeId,
                  }}
                  variant="continue-watching"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Watch history is empty.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
