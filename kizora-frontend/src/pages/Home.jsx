import React from 'react';
import AnimeCard from '../components/AnimeCard';
import { Play, Plus, Sparkles, Flame } from 'lucide-react';

const placeholderTrendingAnime = [
  {
    _id: '1',
    title: 'One Piece',
    slug: 'one-piece',
    synopsis: 'Monkey D. Luffy sets off on an epic journey across the seas to find the legendary One Piece treasure and become the Pirate King.',
    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    genres: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 1090,
    status: 'Ongoing',
    releaseYear: 1999
  },
  {
    _id: '2',
    title: 'Attack on Titan',
    slug: 'attack-on-titan',
    synopsis: 'Humanity resides within giant walled cities to protect themselves from the Titans. Eren Yeager vows to cleanse the earth of all Titans.',
    coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
    genres: ['Action', 'Drama', 'Mystery'],
    totalEpisodes: 89,
    status: 'Completed',
    releaseYear: 2013
  },
  {
    _id: '3',
    title: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself.',
    coverImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1600&auto=format&fit=crop',
    genres: ['Action', 'Supernatural', 'Dark Fantasy'],
    totalEpisodes: 47,
    status: 'Ongoing',
    releaseYear: 2020
  },
  {
    _id: '4',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    slug: 'demon-slayer',
    synopsis: 'Tanjiro Kamado sets out to become a demon slayer to turn his sister back into a human.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop',
    genres: ['Action', 'Historical', 'Supernatural'],
    totalEpisodes: 55,
    status: 'Ongoing',
    releaseYear: 2019
  }
];

const Home = () => {
  const heroAnime = placeholderTrendingAnime[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Hero Banner Section */}
      <section className="relative w-full h-[80vh] min-h-[550px] max-h-[750px] overflow-hidden flex items-end">
        {/* Background Image with Gradient Mask */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroAnime.bannerImage}
            alt={heroAnime.title}
            className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-all duration-1000"
          />
          {/* Antigravity Glass & Fade Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/70 to-transparent w-3/4" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full flex flex-col items-start gap-4">
          {/* Trending Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>#1 Spotlight Trending</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-cyan-200 bg-clip-text text-transparent max-w-2xl">
            {heroAnime.title}
          </h1>

          {/* Hero Synopsis */}
          <p className="text-zinc-300 text-sm sm:text-base max-w-xl line-clamp-3 leading-relaxed">
            {heroAnime.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <button className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-cyan-400 text-black font-bold text-sm hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 transform hover:-translate-y-0.5">
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Episode 1</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 font-semibold text-sm hover:bg-white/20 hover:border-cyan-400/40 backdrop-blur-lg transition-all duration-300">
              <Plus className="w-4 h-4" />
              <span>Add to Watchlist</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Trending Now Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  Trending Now
                </h2>
                <p className="text-xs text-zinc-400">
                  Most watched anime on KIZORA this week
                </p>
              </div>
            </div>

            <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              View All &rarr;
            </button>
          </div>

          {/* Grid of Anime Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {placeholderTrendingAnime.map((anime) => (
              <AnimeCard key={anime._id} anime={anime} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
