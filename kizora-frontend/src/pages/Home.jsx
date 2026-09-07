import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Star,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Compass,
  Bookmark,
  Check,
} from 'lucide-react';
import { fetchTrendingAnime, fetchSpotlight, fetchGenres } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { HeroSkeleton, AnimeGridSkeleton } from '../components/Skeletons';
import { useWatchHistory, useWatchlist } from '../hooks/useStorage';

const Home = () => {
  const navigate = useNavigate();
  const { history } = useWatchHistory();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [spotlights, setSpotlights] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trendingList, setTrendingList] = useState([]);
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [spotlightData, trendingData, genreData] = await Promise.allSettled([
          fetchSpotlight(),
          fetchTrendingAnime(),
          fetchGenres(),
        ]);

        if (isMounted) {
          if (spotlightData.status === 'fulfilled' && spotlightData.value?.length > 0) {
            setSpotlights(spotlightData.value);
          }
          if (trendingData.status === 'fulfilled' && trendingData.value?.length > 0) {
            setTrendingList(trendingData.value);
          }
          if (genreData.status === 'fulfilled' && genreData.value?.length > 0) {
            setGenres(genreData.value.slice(0, 10));
          }
        }
      } catch (err) {
        console.warn('Home data fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentHero = spotlights[heroIndex] || trendingList[0];
  const isHeroBookmarked = currentHero ? isInWatchlist(currentHero._id || currentHero.malId) : false;

  const filteredTrending =
    activeGenre === 'All'
      ? trendingList
      : trendingList.filter((a) =>
          a.genres?.some((g) => g.toLowerCase() === activeGenre.toLowerCase())
        );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 space-y-10">
      {/* ── 1. SPOTLIGHT HERO BANNER ─────────────────────────────── */}
      {loading ? (
        <HeroSkeleton />
      ) : currentHero ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] min-h-[360px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10">
          {/* Hero background image with solid overlay gradient (no neon) */}
          <img
            src={currentHero.bannerImage || currentHero.coverImage}
            alt={currentHero.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115] via-[#0F1115]/60 to-transparent" />

          {/* Hero content */}
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-muted)] text-[var(--accent-hover)] border border-[var(--accent-primary)]/30">
                <Sparkles className="w-3 h-3 fill-current" /> Spotlight
              </span>
              {currentHero.score && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  {currentHero.score}
                </span>
              )}
              {currentHero.releaseYear && (
                <span className="text-xs text-[var(--text-muted)]">
                  &bull; {currentHero.releaseYear}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
              {currentHero.title}
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
              {currentHero.synopsis}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() =>
                  navigate(`/watch/${currentHero._id || currentHero.malId}-ep-1`)
                }
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Episode 1</span>
              </button>

              <button
                onClick={() => toggleWatchlist(currentHero)}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
              >
                {isHeroBookmarked ? (
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

              <button
                onClick={() =>
                  navigate(`/anime/${currentHero._id || currentHero.malId}`)
                }
                className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
              >
                <span>Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          {spotlights.length > 1 && (
            <div className="relative z-10 flex gap-1.5 mt-6 self-start">
              {spotlights.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === heroIndex
                      ? 'w-6 bg-[var(--accent-primary)]'
                      : 'w-2 bg-[var(--border)] hover:bg-[var(--text-muted)]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── 2. CONTINUE WATCHING (Only if user has history) ───────── */}
      {history.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent-hover)]" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Continue Watching
              </h2>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[var(--accent-hover)] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {history.slice(0, 4).map((item) => (
              <AnimeCard
                key={item.episodeId || item.animeId}
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
            ))}
          </div>
        </section>
      )}

      {/* ── 3. GENRE PILLS QUICK FILTER ──────────────────────────── */}
      {genres.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setActiveGenre('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
              activeGenre === 'All'
                ? 'bg-[var(--accent-primary)] text-white font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All Genres
          </button>
          {genres.map((g) => (
            <button
              key={g.id || g.name}
              onClick={() => setActiveGenre(g.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                activeGenre === g.name
                  ? 'bg-[var(--accent-primary)] text-white font-semibold'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* ── 4. TRENDING NOW SECTION ──────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Trending Now
            </h2>
          </div>
          <Link
            to="/browse"
            className="text-xs font-semibold text-[var(--accent-hover)] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <AnimeGridSkeleton count={12} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredTrending.slice(0, 12).map((anime) => (
              <AnimeCard key={anime._id || anime.malId} anime={anime} />
            ))}
          </div>
        )}
      </section>

      {/* ── 5. TOP RATED / POPULAR FAVOURITES ─────────────────────── */}
      {!loading && trendingList.length > 6 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                All-Time Popular Favourites
              </h2>
            </div>
            <Link
              to="/browse?sort=score"
              className="text-xs font-semibold text-[var(--accent-hover)] hover:underline flex items-center gap-1"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {trendingList.slice(6, 12).map((anime) => (
              <AnimeCard key={`fav-${anime._id || anime.malId}`} anime={anime} />
            ))}
          </div>
        </section>
      )}

      {/* ── 6. BROWSE CTA BANNER ─────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Explore the Complete Anime Catalogue
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Browse by genres, airing status, seasonal releases, and release years.
          </p>
        </div>
        <button
          onClick={() => navigate('/browse')}
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex-shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Open Catalogue</span>
        </button>
      </div>
    </div>
  );
};

export default Home;