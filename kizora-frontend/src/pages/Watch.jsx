import React from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Star, Eye, Calendar, Sparkles, Film, ArrowRight } from 'lucide-react';

const placeholderEpisodeData = {
  id: 'ep-1090',
  animeTitle: 'One Piece',
  episodeNumber: 1090,
  title: 'Wano Country Arc - The Final Showdown! Luffy vs Kaido',
  synopsis: 'As the battle above Onigashima reaches its climax, Luffy channels the ancient power of Gear 5 to challenge Kaido in a battle that will reshape the fate of Wano Country forever.',
  releaseDate: '2024-01-21',
  views: '2.4M',
  rating: '4.95',
  posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
};

const placeholderUpNextEpisodes = [
  {
    id: 'ep-1091',
    episodeNumber: 1091,
    title: 'The Future Island! Adventure in Egghead',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    duration: '24:00'
  },
  {
    id: 'ep-1092',
    episodeNumber: 1092,
    title: 'Dr. Vegapunk’s Secret Laboratory',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    duration: '23:45'
  },
  {
    id: 'ep-1093',
    episodeNumber: 1093,
    title: 'Seraphim Threat! Emergency Defense',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    duration: '24:15'
  }
];

const Watch = () => {
  const { episodeId } = useParams();
  const currentEp = placeholderEpisodeData;

  // Stream URL connecting to backend Phase 3 endpoint
  const videoStreamUrl = `http://localhost:5000/api/stream/video/${episodeId || '65b2f1a9e8d4a9b2c3d4e5f6'}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Video Player Container */}
      <div className="w-full mb-8">
        <VideoPlayer
          src={videoStreamUrl}
          poster={currentEp.posterUrl}
          title={currentEp.title}
        />
      </div>

      {/* Episode Header & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (Left 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Info Box */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                Episode {currentEp.episodeNumber}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {currentEp.animeTitle}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {currentEp.rating}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Eye className="w-3.5 h-3.5" />
                {currentEp.views} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
              {currentEp.title}
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
              {currentEp.synopsis}
            </p>

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Air Date: {currentEp.releaseDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>1080p Ultra HD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Up Next Sidebar (Right 1 col) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Up Next</span>
            </h2>
            <span className="text-xs text-zinc-400">Auto-play ON</span>
          </div>

          <div className="flex flex-col gap-3">
            {placeholderUpNextEpisodes.map((ep) => (
              <Link
                key={ep.id}
                to={`/watch/${ep.id}`}
                className="group p-3 rounded-2xl bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-300 flex gap-4"
              >
                {/* Thumbnail */}
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0">
                  <img
                    src={ep.thumbnail}
                    alt={ep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Play className="w-5 h-5 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/80 text-zinc-300 font-mono">
                    {ep.duration}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-cyan-400">
                    Episode {ep.episodeNumber}
                  </span>
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 transition-colors line-clamp-2 mt-0.5">
                    {ep.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
