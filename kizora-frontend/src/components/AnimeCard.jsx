import React from 'react';
import { Play, Star } from 'lucide-react';

const AnimeCard = ({ anime }) => {
  const { title, coverImage, genres, totalEpisodes, status, releaseYear } = anime;

  return (
    <div className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] flex flex-col">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-cyan-400/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Status / Year Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {status && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
              {status}
            </span>
          )}
          {releaseYear && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
              {releaseYear}
            </span>
          )}
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-base text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
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

        {/* Episode count footer */}
        {totalEpisodes > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span>{totalEpisodes} Episodes</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>4.9</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeCard;
