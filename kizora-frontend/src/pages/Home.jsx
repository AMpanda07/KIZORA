import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { Play, Plus, Sparkles, Flame, Film, ChevronLeft, ChevronRight, Filter, Search, Loader2 } from 'lucide-react';

const Home = () => {
  const [spotlightList, setSpotlightList] = useState([]);
  const [trendingList, setTrendingList] = useState([]);
  const [recentList, setRecentList] = useState([]);
  const [genres, setGenres] = useState([]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Auto-play hero carousel interval
  useEffect(() => {
    if (spotlightList.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % spotlightList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [spotlightList]);

  // Fetch aggregated data on mount
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [spotRes, trendRes, recRes, genreRes] = await Promise.allSettled([
          API.get('/provider/spotlight'),
          API.get('/provider/trending'),
          API.get('/provider/recent'),
          API.get('/provider/genres')
        ]);

        if (spotRes.status === 'fulfilled' && spotRes.value.data.length > 0) {
          setSpotlightList(spotRes.value.data);
        }
        if (trendRes.status === 'fulfilled' && trendRes.value.data.length > 0) {
          setTrendingList(trendRes.value.data);
        }
        if (recRes.status === 'fulfilled' && recRes.value.data.length > 0) {
          setRecentList(recRes.value.data);
        }
        if (genreRes.status === 'fulfilled' && genreRes.value.data.length > 0) {
          setGenres(genreRes.value.data.slice(0, 16));
        }
      } catch (err) {
        console.warn('Home data aggregation fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const currentHero = spotlightList[activeSlide] || trendingList[0] || {
    _id: '1',
    title: 'One Piece',
    synopsis: 'Monkey D. Luffy sets off on an epic journey across the seas to find the legendary One Piece treasure.',
    bannerImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    genres: ['Action', 'Adventure', 'Fantasy']
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Floating Glassmorphic Sync Indicator */}
      {loading && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Syncing Live Anime Kai Engine...</span>
        </div>
      )}

      {/* Hero Spotlight Carousel */}
      <section className="relative w-full h-[85vh] min-h-[580px] max-h-[800px] overflow-hidden flex items-end">
        {/* Background Banner */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentHero.bannerImage || currentHero.coverImage}
            alt={currentHero.title}
            className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-all duration-1000"
          />
          {/* Antigravity Glass Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/75 to-transparent w-4/5" />
        </div>

        {/* Hero Info Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spotlight #{activeSlide + 1} Trending</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-cyan-200 bg-clip-text text-transparent max-w-3xl leading-tight">
            {currentHero.title}
          </h1>

          <div className="flex flex-wrap gap-2 my-1">
            {currentHero.genres && currentHero.genres.map((g, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 text-zinc-200">
                {g}
              </span>
            ))}
          </div>

          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed">
            {currentHero.synopsis}
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => navigate(`/watch/${currentHero._id || '1'}`)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-cyan-400 text-black font-bold text-sm hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Episode 1</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 font-semibold text-sm hover:bg-white/20 hover:border-cyan-400/40 backdrop-blur-lg transition-all duration-300">
              <Plus className="w-4 h-4" />
              <span>Add to Watchlist</span>
            </button>
          </div>
        </div>

        {/* Carousel Navigation Dots & Controls */}
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2">
          <button
            onClick={() => setActiveSlide((prev) => (prev === 0 ? spotlightList.length - 1 : prev - 1))}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1.5">
            {spotlightList.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  activeSlide === idx ? 'w-6 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % spotlightList.length)}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-cyan-400 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Main Content Layout with Discovery Sidebar */}
      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Trending & Recent Grids (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-12">
          {/* Trending Airing Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">
                    Trending Airing
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Most watched anime across streaming networks
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {trendingList.slice(0, 6).map((anime) => (
                <AnimeCard key={anime._id} anime={anime} />
              ))}
            </div>
          </section>

          {/* Recent Releases Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">
                    New Season Releases
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Latest episode additions updated live
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recentList.slice(0, 6).map((anime) => (
                <AnimeCard key={anime._id} anime={anime} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Frosted Glass Discovery Sidebar (1 col) */}
        <aside className="flex flex-col gap-6">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          </form>

          {/* Genre Explorer Box */}
          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Filter className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">
                Explore Genres
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedGenre === genre.name
                      ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                      : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-cyan-400/30'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Home;
