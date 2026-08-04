import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Sparkles } from 'lucide-react';

const AnimeCard = ({ anime }) => {
  const navigate = useNavigate();
  if (!anime) return null;

  const {
    _id,
    title,
    coverImage,
    genres,
    totalEpisodes,
    status,
    releaseYear,
    score,
    malId
  } = anime;

  const handleClick = () => {
    navigate(`/watch/${_id || malId || '1'}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer relative glass-panel-interactive rounded-2xl overflow-hidden flex flex-col h-full"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0B0C10]">
        <img
          src={coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Gradient Overlay with Floating Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10]/90 via-[#0B0C10]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Floating Top Pill Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {status && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow-sm">
              {status}
            </span>
          )}
          {score && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-amber-400" />
              <span>{score}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-base text-zinc-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
            {title}
          </h3>

          {/* Genres Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres && genres.slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 border border-white/5 text-zinc-400"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Episodes / Release Info */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <span>{totalEpisodes ? `${totalEpisodes} Ep` : 'HD'}</span>
          {releaseYear && (
            <span className="text-zinc-500 font-mono">{releaseYear}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
