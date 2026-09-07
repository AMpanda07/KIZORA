import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Bookmark,
  Check,
  Star,
  Calendar,
  Clock,
  Tv,
  ArrowLeft,
  Film,
} from 'lucide-react';
import { fetchAnimeInfo, fetchEpisodes } from '../services/api';
import { useWatchlist, useWatchHistory } from '../hooks/useStorage';
import { DetailsSkeleton } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';

const AnimeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { history } = useWatchHistory();

  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user has watch history for this anime
  const historyItem = history.find((h) => String(h.animeId) === String(id));

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const info = await fetchAnimeInfo(id);
        if (isMounted) {
          setAnime(info);
          setLoading(false);
        }

        // Lazy load episodes
        try {
          const epList = await fetchEpisodes(id);
          if (isMounted) {
            setEpisodes(epList || []);
            setEpisodesLoading(false);
          }
        } catch (epErr) {
          console.warn('Episode list resolution failed:', epErr);
          if (isMounted) setEpisodesLoading(false);
        }
      } catch (err) {
        console.error('Failed to load anime details:', err);
        if (isMounted) {
          setError('Could not load anime details. Please check your connection or try again.');
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        <DetailsSkeleton />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <ErrorState
          title="Anime not found"
          message={error || 'Unable to find anime details.'}
          onRetry={() => window.location.reload()}
          showBack
        />
      </div>
    );
  }

  const isBookmarked = isInWatchlist(id);
  const startEpisodeNum = historyItem?.episodeNumber || 1;
  const startEpisodeId = historyItem?.episodeId || `${id}-ep-${startEpisodeNum}`;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* ── Main Details Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start mb-12">
        {/* Poster */}
        <div className="w-44 sm:w-56 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] flex-shrink-0 shadow-xl">
          <img
            src={anime.coverImage}
            alt={anime.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600';
            }}
          />
        </div>

        {/* Metadata & Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {anime.status && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                {anime.status}
              </span>
            )}
            {anime.type && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                {anime.type}
              </span>
            )}
            {anime.rating && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                {anime.rating}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1 leading-tight">
            {anime.title}
          </h1>

          {anime.japaneseTitle && anime.japaneseTitle !== anime.title && (
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-4">
              {anime.japaneseTitle}
            </p>
          )}

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] mb-6 py-2.5 border-y border-[var(--border-subtle)]">
            {anime.score && (
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-4 h-4 fill-current" />
                <span>{anime.score} / 10</span>
              </div>
            )}
            {anime.releaseYear && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{anime.releaseYear}</span>
              </div>
            )}
            {anime.totalEpisodes && (
              <div className="flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{anime.totalEpisodes} Episodes</span>
              </div>
            )}
            {anime.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{anime.duration}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  to={`/browse?genre=${encodeURIComponent(g)}`}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)] transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => navigate(`/watch/${startEpisodeId}`)}
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {historyItem ? `Resume Ep ${startEpisodeNum}` : 'Watch Episode 1'}
              </span>
            </button>

            <button
              onClick={() => toggleWatchlist(anime)}
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              {isBookmarked ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Synopsis
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-6">
              {anime.synopsis}
            </p>
          </div>
        </div>
      </div>

      {/* ── Episodes List Section ──────────────────────────────────── */}
      <section className="mt-8 pt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[var(--accent-hover)]" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Episodes ({episodes.length || anime.totalEpisodes || '—'})
            </h2>
          </div>
        </div>

        {episodesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {episodes.map((ep) => {
              const isCurrent = historyItem?.episodeNumber === ep.episodeNumber;
              return (
                <div
                  key={ep._id || ep.episodeNumber}
                  onClick={() => navigate(`/watch/${ep._id || `${id}-ep-${ep.episodeNumber}`}`)}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                      : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="relative w-20 h-12 rounded-lg bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
                    <img
                      src={ep.thumbnail || anime.coverImage}
                      alt={ep.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = anime.coverImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5 text-white fill-current" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Ep {ep.episodeNumber}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent-primary)] text-white font-medium">
                          Watching
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      {ep.title || `Episode ${ep.episodeNumber}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Episodes will be resolved upon streaming. Click below to launch the video player.
            </p>
            <button
              onClick={() => navigate(`/watch/${id}-ep-1`)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch Episode 1
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnimeDetail;
