import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { Play, Plus, Sparkles, Flame, Film } from 'lucide-react';

const SkeletonCard = () => (
  <div className="glass-panel rounded-2xl overflow-hidden animate-pulse flex flex-col h-72">
    <div className="aspect-[3/4] w-full bg-white/5" />
    <div className="p-4 flex flex-col gap-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2 mt-1" />
    </div>
  </div>
);

const Home = () => {
  const [animeCatalog, setAnimeCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        // Fetch from MongoDB backend endpoint /api/anime (populated by cron job / on-demand)
        const response = await API.get('/anime');
        if (response.data && response.data.length > 0) {
          setAnimeCatalog(response.data);
        }
      } catch (err) {
        console.warn('API fetch error, fallback to initial entries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const heroAnime = animeCatalog.length > 0 ? animeCatalog[0] : null;

  return (
    <div className="min-h-screen bg-[#0B0C10] text-zinc-100 pb-20">
      {/* Full-width Dramatic Hero Section */}
      <section className="relative w-full h-[85vh] min-h-[580px] max-h-[800px] overflow-hidden flex items-end">
        {heroAnime && (
          <div className="absolute inset-0 z-0">
            <img
              src={heroAnime.bannerImage || heroAnime.coverImage}
              alt={heroAnime.title}
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-all duration-1000"
            />
            {/* Dramatic Bottom-to-Top Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/75 to-transparent w-4/5" />
          </div>
        )}

        {/* Hero Content */}
        {heroAnime && (
          <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>#1 Featured Anime</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent max-w-3xl leading-tight">
              {heroAnime.title}
            </h1>

            <div className="flex flex-wrap gap-2 my-1">
              {heroAnime.genres && heroAnime.genres.map((g, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 text-zinc-200">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-zinc-300 text-sm sm:text-base max-w-2xl line-clamp-3 leading-relaxed">
              {heroAnime.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => navigate(`/watch/${heroAnime._id || heroAnime.malId || '1'}`)}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Watch Now</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 font-semibold text-sm hover:bg-white/20 hover:border-indigo-400/40 backdrop-blur-lg transition-all duration-300">
                <Plus className="w-4 h-4" />
                <span>Add to Watchlist</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Catalog Sections */}
      <main className="max-w-7xl mx-auto px-6 mt-10 flex flex-col gap-12">
        {/* Trending Now Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">
                Trending Now
              </h2>
              <p className="text-xs text-zinc-400">
                Top anime from your MongoDB database
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {animeCatalog.map((anime) => (
                <AnimeCard key={anime._id} anime={anime} />
              ))}
            </div>
          )}
        </section>

        {/* New Releases Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">
                New Releases
              </h2>
              <p className="text-xs text-zinc-400">
                Latest catalog sync
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {animeCatalog.slice(0, 4).map((anime) => (
              <AnimeCard key={`recent-${anime._id}`} anime={anime} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
