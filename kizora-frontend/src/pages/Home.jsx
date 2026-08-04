import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrendingAnime } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import {
  Play, Plus, Star, ChevronRight, Flame, Clock,
  TrendingUp, Eye, Filter, Search, Bell, User,
  Sparkles, Award, Calendar
} from 'lucide-react';

// ── Skeleton components ───────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(26,16,48,0.8)', border: '1px solid rgba(124,58,237,0.1)' }}>
    <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
    <div className="p-3 flex flex-col gap-2">
      <div className="skeleton h-3 rounded" style={{ width: '80%' }} />
      <div className="skeleton h-2.5 rounded" style={{ width: '55%' }} />
    </div>
  </div>
);

const HeroSkeleton = () => (
  <div className="relative w-full h-[460px] rounded-3xl overflow-hidden skeleton">
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,10,30,0.97) 0%, transparent 100%)' }} />
    <div className="absolute bottom-10 left-10 space-y-4 w-80">
      <div className="skeleton h-5 w-28 rounded-full" />
      <div className="skeleton h-12 w-72 rounded-xl" />
      <div className="skeleton h-4 w-60 rounded" />
      <div className="skeleton h-4 w-52 rounded" />
      <div className="flex gap-3 mt-4">
        <div className="skeleton h-11 w-32 rounded-full" />
        <div className="skeleton h-11 w-36 rounded-full" />
      </div>
    </div>
  </div>
);

// ── Genre Filter Pill ──────────────────────────────────────────────────────────
const GenrePill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
    style={active ? {
      background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
      color: '#fff',
      boxShadow: '0 0 16px rgba(124,58,237,0.5)',
    } : {
      background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.2)',
      color: '#7B6EA8',
    }}
  >
    {label}
  </button>
);

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, iconColor = '#8B5CF6' }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: '#7B6EA8' }}>{subtitle}</p>}
      </div>
    </div>
    <button
      className="flex items-center gap-1 text-xs font-semibold transition-colors duration-200"
      style={{ color: '#7C3AED' }}
      onMouseEnter={e => e.currentTarget.style.color = '#A78BFA'}
      onMouseLeave={e => e.currentTarget.style.color = '#7C3AED'}
    >
      See all <ChevronRight className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ── Top Ranking Item ──────────────────────────────────────────────────────────
const RankItem = ({ anime, rank, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all duration-200"
    style={{ border: '1px solid transparent' }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(124,58,237,0.1)';
      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = 'transparent';
    }}
  >
    <span
      className="text-lg font-black w-7 text-center flex-shrink-0"
      style={{ color: rank <= 3 ? '#7C3AED' : '#4B3E7A', lineHeight: 1 }}
    >
      {rank < 10 ? `0${rank}` : rank}
    </span>
    <div
      className="w-11 h-14 rounded-lg overflow-hidden flex-shrink-0"
      style={{ background: '#1A1030' }}
    >
      <img
        src={anime.coverImage}
        alt={anime.title}
        className="w-full h-full object-cover"
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400'; }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-xs font-bold line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors" style={{ color: '#E2D9F3' }}>
        {anime.title}
      </h4>
      <div className="flex items-center gap-1 mt-1">
        {anime.score && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: '#F59E0B' }}>
            <Star className="w-2.5 h-2.5 fill-current" /> {anime.score}
          </span>
        )}
        {anime.genres?.[0] && (
          <span className="text-[9px]" style={{ color: '#4B3E7A' }}>• {anime.genres[0]}</span>
        )}
      </div>
    </div>
  </div>
);

// ── Schedule / Coming Soon Item ───────────────────────────────────────────────
const ScheduleItem = ({ anime, time }) => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}
  >
    <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1A1030' }}>
      <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover"
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400'; }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold line-clamp-1" style={{ color: '#E2D9F3' }}>{anime.title}</p>
      <p className="text-[10px] mt-0.5" style={{ color: '#7B6EA8' }}>Episode {anime.totalEpisodes || '?'}</p>
    </div>
    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
      {time}
    </span>
  </div>
);

// ── GENRES ────────────────────────────────────────────────────────────────────
const GENRES = ['All', 'Action', 'Romance', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Thriller', 'Adventure'];

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
const Home = () => {
  const [animeList, setAnimeList] = useState([]);
  const [heroAnime, setHeroAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [heroIndex, setHeroIndex] = useState(0);
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

  // Auto-cycle hero every 6 seconds
  useEffect(() => {
    if (animeList.length < 2) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => {
        const next = (prev + 1) % Math.min(animeList.length, 5);
        setHeroAnime(animeList[next]);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [animeList]);

  const filteredList = activeGenre === 'All'
    ? animeList
    : animeList.filter(a => a.genres?.includes(activeGenre));

  const topRanked = [...animeList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);
  const recentAnime = animeList.slice(0, 6);
  const scheduleItems = animeList.slice(6, 9);

  return (
    <div className="min-h-screen" style={{ background: '#0F0A1E' }}>
      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between px-8 py-4"
        style={{
          left: '220px', // sidebar width
          background: 'rgba(15,10,30,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
        }}
      >
        <div>
          <h1 className="text-sm font-bold text-white">Good evening 👋</h1>
          <p className="text-xs" style={{ color: '#7B6EA8' }}>Discover your next favourite anime</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.18)',
              minWidth: '220px',
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#7B6EA8' }} />
            <input
              type="text"
              placeholder="Search anime, genre..."
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: '#E2D9F3', caretColor: '#8B5CF6' }}
            />
          </div>

          {/* Notification bell */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <Bell className="w-4 h-4" style={{ color: '#A78BFA' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#C026D3' }} />
          </button>

          {/* User avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
              boxShadow: '0 0 14px rgba(124,58,237,0.4)',
            }}
          >
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT: Content + Right Panel ──────────────────────────────── */}
      <div
        className="flex gap-0"
        style={{ paddingLeft: '220px', paddingTop: '73px', minHeight: '100vh' }}
      >
        {/* ── CENTER CONTENT AREA ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-8 py-6 overflow-y-auto af-scrollbar" style={{ maxWidth: '900px' }}>

          {/* ── HERO SECTION ─────────────────────────────────────────────── */}
          {loading ? <HeroSkeleton /> : heroAnime && (
            <section
              className="relative w-full rounded-3xl overflow-hidden mb-8"
              style={{ height: '440px', background: '#1A1030' }}
            >
              {/* Background artwork */}
              <img
                src={heroAnime.bannerImage || heroAnime.coverImage}
                alt={heroAnime.title}
                key={heroAnime._id}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ filter: 'brightness(0.6)', transition: 'opacity 0.6s ease', transform: 'scale(1.04)' }}
              />

              {/* Gradient overlays */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(15,10,30,0.98) 0%, rgba(15,10,30,0.7) 45%, rgba(15,10,30,0.15) 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,10,30,0.97) 0%, transparent 50%)' }} />

              {/* Glow blob */}
              <div className="absolute right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />

              {/* Hero content */}
              <div className="relative z-10 h-full flex flex-col justify-end px-10 pb-10">
                {/* Featured badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', color: '#C4B5FD' }}
                  >
                    <Sparkles className="w-3 h-3 fill-current" /> Featured
                  </div>
                  {heroAnime.status && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                      style={{
                        background: heroAnime.status === 'Ongoing' ? 'rgba(6,182,212,0.15)' : 'rgba(124,58,237,0.15)',
                        border: `1px solid ${heroAnime.status === 'Ongoing' ? 'rgba(6,182,212,0.4)' : 'rgba(124,58,237,0.4)'}`,
                        color: heroAnime.status === 'Ongoing' ? '#06B6D4' : '#A78BFA',
                      }}
                    >
                      {heroAnime.status}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1
                  className="text-4xl font-black tracking-tight leading-none mb-3 max-w-lg"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #DDD6FE 60%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                  }}
                >
                  {heroAnime.title}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {heroAnime.genres?.slice(0, 3).map((g, i) => (
                    <span key={i} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#D4D4D8' }}>
                      {g}
                    </span>
                  ))}
                </div>

                {/* Synopsis */}
                <p className="text-sm leading-relaxed mb-5 max-w-md line-clamp-2" style={{ color: '#A1A1AA' }}>
                  {heroAnime.synopsis || 'Experience premium cinematic anime streaming with automated catalog sync.'}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-5 mb-5">
                  {heroAnime.score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" style={{ color: '#F59E0B' }} />
                      <span className="text-sm font-bold text-white">{heroAnime.score}</span>
                    </div>
                  )}
                  {heroAnime.totalEpisodes && (
                    <div className="flex items-center gap-1">
                      <Film className="w-4 h-4" style={{ color: '#7B6EA8' }} />
                      <span className="text-sm" style={{ color: '#A1A1AA' }}>{heroAnime.totalEpisodes} Eps</span>
                    </div>
                  )}
                  {heroAnime.releaseYear && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" style={{ color: '#7B6EA8' }} />
                      <span className="text-sm" style={{ color: '#A1A1AA' }}>{heroAnime.releaseYear}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/watch/${heroAnime._id || heroAnime.malId || '21'}`)}
                    className="btn-primary flex items-center gap-2.5 px-7 py-3 rounded-full font-bold text-sm text-white"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </button>
                  <button
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                      color: '#E2D9F3',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  >
                    <Plus className="w-4 h-4" />
                    Add to List
                  </button>
                </div>
              </div>

              {/* Hero dot indicators */}
              <div className="absolute bottom-8 right-10 flex gap-1.5">
                {animeList.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setHeroIndex(i); setHeroAnime(animeList[i]); }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === heroIndex ? '20px' : '6px',
                      height: '6px',
                      background: i === heroIndex ? '#8B5CF6' : 'rgba(139,92,246,0.3)',
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── GENRE FILTER PILLS ────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 af-scrollbar">
            {GENRES.map(g => (
              <GenrePill key={g} label={g} active={activeGenre === g} onClick={() => setActiveGenre(g)} />
            ))}
          </div>

          {/* ── TRENDING GRID ────────────────────────────────────────────── */}
          <section className="mb-10">
            <SectionHeader
              icon={Flame}
              title="Trending Right Now"
              subtitle="Updated daily from Jikan & AniList"
              iconColor="#C026D3"
            />

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(filteredList.length > 0 ? filteredList : animeList).slice(0, 8).map(anime => (
                  <AnimeCard key={anime._id || anime.malId} anime={anime} />
                ))}
              </div>
            )}
          </section>

          {/* ── RECENTLY ADDED ROW ──────────────────────────────────────── */}
          {!loading && animeList.length > 4 && (
            <section className="mb-6">
              <SectionHeader
                icon={Clock}
                title="Continue Watching"
                subtitle="Pick up where you left off"
                iconColor="#06B6D4"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {animeList.slice(4, 7).map(anime => (
                  <AnimeCard key={`cw-${anime._id}`} anime={anime} />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <aside
          className="flex-shrink-0 py-6 px-5 overflow-y-auto af-scrollbar"
          style={{
            width: '290px',
            background: 'rgba(15,10,30,0.6)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(124,58,237,0.1)',
          }}
        >
          {/* ── Top Anime Ranking ────────────────────────────────────────── */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Award className="w-4 h-4" style={{ color: '#F59E0B' }} />
                </div>
                <h3 className="text-sm font-bold text-white">Top Ranked</h3>
              </div>
              <button className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>
                View all
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <div className="skeleton w-7 h-4 rounded" />
                    <div className="skeleton w-11 h-14 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 rounded" style={{ width: '90%' }} />
                      <div className="skeleton h-2.5 rounded" style={{ width: '60%' }} />
                    </div>
                  </div>
                ))
              ) : topRanked.map((anime, i) => (
                <RankItem
                  key={anime._id}
                  anime={anime}
                  rank={i + 1}
                  onClick={() => navigate(`/watch/${anime._id || anime.malId}`)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(124,58,237,0.1)', marginBottom: '24px' }} />

          {/* ── Schedule / Coming Soon ────────────────────────────────────── */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#06B6D4' }} />
                </div>
                <h3 className="text-sm font-bold text-white">Schedule</h3>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: '#7B6EA8' }}>Today</span>
            </div>

            <div className="flex flex-col gap-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))
              ) : scheduleItems.map((anime, i) => (
                <ScheduleItem
                  key={`sched-${anime._id}`}
                  anime={anime}
                  time={['18:00', '20:30', '22:00'][i]}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(124,58,237,0.1)', marginBottom: '24px' }} />

          {/* ── Quick Stats ───────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Anime', value: `${animeList.length}+`, icon: TrendingUp, color: '#7C3AED' },
                { label: 'Episodes', value: '500+', icon: Play, color: '#C026D3' },
                { label: 'HD Streams', value: '24/7', icon: Eye, color: '#06B6D4' },
                { label: 'Genres', value: '20+', icon: Filter, color: '#F59E0B' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <p className="text-sm font-black text-white">{value}</p>
                  <p className="text-[10px]" style={{ color: '#7B6EA8' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Need this import for the Film icon used in hero meta
import { Film } from 'lucide-react';

export default Home;