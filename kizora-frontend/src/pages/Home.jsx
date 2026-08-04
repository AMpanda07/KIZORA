import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrendingAnime } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { Play, Plus, Flame, Sparkles, TrendingUp } from 'lucide-react';

// ─── Skeleton loader card ────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="aspect-[3/4] w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
    <div className="p-3 flex flex-col gap-2">
      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.1)', width: '75%' }} />
      <div className="h-2.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: '50%' }} />
    </div>
  </div>
);

// ─── Hero skeleton ───────────────────────────────────────────────────────────
const HeroSkeleton = () => (
  <section className="relative w-full h-[82vh] min-h-[520px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0B0C10 0%, transparent 100%)' }} />
    <div className="absolute bottom-16 left-8 space-y-4 max-w-2xl">
      <div className="h-5 w-32 rounded-full" style={{ background: 'rgba(139,92,246,0.3)' }} />
      <div className="h-14 w-96 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div className="h-4 w-80 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 w-72 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  </section>
);

// ─── Home Page ───────────────────────────────────────────────────────────────
const Home = () => {
  const [animeList, setAnimeList] = useState([]);
  const [heroAnime, setHeroAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      try {
        const data = await fetchTrendingAnime();
        if (mounted && data && data.length > 0) {
          setAnimeList(data);
          setHeroAnime(data[0]);
        }
      } catch (err) {
        console.error('[Home] Failed to load catalog:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCatalog();
    return () => { mounted = false; };
  }, []);

  const handleWatchNow = () => {
    if (heroAnime) {
      navigate(`/watch/${heroAnime._id || heroAnime.malId || '21'}`);
    }
  };

  return (
    <div className="min-h-screen text-white pb-24 overflow-x-hidden" style={{ background: '#0B0C10' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      {loading ? <HeroSkeleton /> : heroAnime && (
        <section className="relative w-full h-[82vh] min-h-[520px] flex items-end">
          {/* Background artwork */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={heroAnime.bannerImage || heroAnime.coverImage}
              alt={heroAnime.title}
              className="w-full h-full object-cover object-center"
              style={{ filter: 'brightness(0.75)', transform: 'scale(1.04)', transition: 'transform 8s ease-out' }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0B0C10 0%, #0B0C10aa 30%, transparent 70%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0B0C10 0%, #0B0C10bb 35%, transparent 65%)' }} />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
            <div className="max-w-2xl space-y-5">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Featured Today
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none"
                style={{ background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 60%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {heroAnime.title}
              </h1>

              {/* Genres */}
              {heroAnime.genres && (
                <div className="flex flex-wrap gap-2">
                  {heroAnime.genres.slice(0, 4).map((g, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#d4d4d8' }}>
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              <p className="text-sm md:text-base leading-relaxed line-clamp-3" style={{ color: '#a1a1aa' }}>
                {heroAnime.synopsis || 'Experience premium anime streaming with automated catalog updates and cinematic playback.'}
              </p>

              {/* Metadata row */}
              <div className="flex items-center gap-4 text-xs" style={{ color: '#71717a' }}>
                {heroAnime.score && (
                  <span className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                    ★ {heroAnime.score}
                  </span>
                )}
                {heroAnime.releaseYear && <span>{heroAnime.releaseYear}</span>}
                {heroAnime.totalEpisodes && <span>{heroAnime.totalEpisodes} Episodes</span>}
                {heroAnime.status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: heroAnime.status === 'Ongoing' ? 'rgba(34,211,238,0.15)' : 'rgba(139,92,246,0.15)', color: heroAnime.status === 'Ongoing' ? '#22d3ee' : '#c4b5fd', border: `1px solid ${heroAnime.status === 'Ongoing' ? 'rgba(34,211,238,0.3)' : 'rgba(139,92,246,0.3)'}` }}>
                    {heroAnime.status}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={handleWatchNow}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', boxShadow: '0 0 30px rgba(139,92,246,0.5)' }}>
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full font-semibold text-sm text-zinc-200 transition-all duration-300 hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                  <Plus className="w-4 h-4" />
                  Add to Library
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATALOG SECTION ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 space-y-14" style={{ marginTop: heroAnime || loading ? '-3rem' : '6rem', position: 'relative', zIndex: 20 }}>

        {/* Trending row */}
        <section>
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Flame className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Trending Right Now</h2>
                <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>Live catalog from Jikan &amp; AniList</p>
              </div>
            </div>
            <span className="text-xs font-semibold cursor-pointer transition-colors" style={{ color: '#8B5CF6' }}>
              Explore All →
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {animeList.map((anime) => (
                <AnimeCard key={anime._id || anime.malId} anime={anime} />
              ))}
            </div>
          )}
        </section>

        {/* Top Picks row (second section using same data) */}
        {!loading && animeList.length > 6 && (
          <section>
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Top Picks For You</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>Curated from top-rated classics</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {[...animeList].reverse().slice(0, 6).map((anime) => (
                <AnimeCard key={`top-${anime._id || anime.malId}`} anime={anime} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;