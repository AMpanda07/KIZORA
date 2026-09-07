import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Bookmark, Check } from 'lucide-react';
import { useWatchlist } from '../hooks/useStorage';

const AnimeCard = ({ anime, variant = 'default' }) => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  if (!anime) return null;

  const animeId = String(anime._id || anime.malId || anime.id || '1');
  const title = anime.title || anime.name || 'Untitled Anime';
  const poster = anime.coverImage || anime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400';
  const score = anime.score;
  const status = anime.status;
  const year = anime.releaseYear || anime.year;
  const episodes = anime.totalEpisodes || anime.episodes;
  const isBookmarked = isInWatchlist(animeId);

  const handleCardClick = () => {
    navigate(`/anime/${animeId}`);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    toggleWatchlist(anime);
  };

  // ── 1. Continue Watching Variant ──────────────────────────────────────────
  if (variant === 'continue-watching') {
    const episodeNum = anime.episodeNumber || 1;
    const progress = anime.progress || 0;
    const episodeId = anime.episodeId || `${animeId}-ep-${episodeNum}`;

    return (
      <div
        onClick={() => navigate(`/watch/${episodeId}`)}
        className="group relative flex flex-col rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] transition-all duration-200 cursor-pointer"
      >
        <div className="relative aspect-video w-full bg-[var(--bg-elevated)] overflow-hidden">
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600';
            }}
          />
          {/* Subtle play icon overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-white backdrop-blur-xs">
            Ep {episodeNum}
          </span>
        </div>

        <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-hover)] transition-colors">
              {title}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {anime.episodeTitle || `Episode ${episodeNum}`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mt-1">
            <div className="w-full h-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>{progress > 0 ? `${progress}% watched` : 'Started'}</span>
              <span className="text-[var(--accent-hover)] font-medium">Resume</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Horizontal / Compact Ranking List Variant ──────────────────────────
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className="group flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer"
      >
        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-hover)] transition-colors">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
            {score && (
              <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                <Star className="w-2.5 h-2.5 fill-current" />
                {score}
              </span>
            )}
            {year && <span>{year}</span>}
            {episodes && <span>{episodes} Eps</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Default Vertical Poster Card Variant ───────────────────────────────
  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-focus)] transition-all duration-200 cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full bg-[var(--bg-elevated)] overflow-hidden">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600';
          }}
        />

        {/* Watchlist Bookmark Button (Always clickable, on hover on desktop or static on mobile) */}
        <button
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 z-10 ${
            isBookmarked
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-black/60 text-[var(--text-secondary)] hover:text-white sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>

        {/* Status Badge */}
        {status && (
          <span
            className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider backdrop-blur-xs ${
              status.toLowerCase().includes('ongoing') || status.toLowerCase().includes('airing')
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                : 'bg-black/70 text-[var(--text-secondary)] border border-white/10'
            }`}
          >
            {status}
          </span>
        )}

        {/* Score Badge */}
        {score && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/75 text-amber-400 backdrop-blur-xs border border-white/5">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{score}</span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 gap-1">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-hover)] transition-colors">
            {title}
          </h3>

          {anime.genres && anime.genres.length > 0 && (
            <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
              {anime.genres.slice(0, 2).join(' • ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
          <span>{episodes ? `${episodes} Eps` : anime.type || 'TV'}</span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
