import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

export const AnimeCard = ({ anime, layout = 'vertical' }) => {
  if (layout === 'horizontal') {
    return (
      <Link to={`/anime/${anime.id}`} className="group flex bg-kz-surface rounded overflow-hidden border border-kz-border hover:border-kz-primary transition-colors">
        <div className="w-32 h-48 flex-shrink-0 relative">
          <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play className="text-white" size={32} />
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg line-clamp-2 text-kz-text group-hover:text-kz-primary transition-colors">{anime.title}</h3>
            {anime.airingTime && (
              <span className="text-xs font-mono font-bold bg-kz-primary/20 text-kz-primary px-2 py-0.5 rounded border border-kz-primary/30 flex-shrink-0">
                {anime.airingTime} JST
              </span>
            )}
          </div>
          <div className="flex items-center text-kz-muted text-sm mt-1 mb-2 space-x-3">
            <span className="flex items-center"><Star size={14} className="text-kz-secondary mr-1" /> {anime.score}</span>
            <span>{anime.status}</span>
          </div>
          <p className="text-kz-muted text-sm line-clamp-3 mb-2 flex-1">{anime.synopsis}</p>
          <div className="flex flex-wrap gap-1 mt-auto">
            {anime.genres?.slice(0, 3).map(g => (
              <span key={g} className="text-xs bg-kz-card px-2 py-1 rounded text-kz-muted">{g}</span>
            ))}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/anime/${anime.id}`} className="group block">
      <div className="relative rounded overflow-hidden aspect-[3/4] mb-2 border border-transparent group-hover:border-kz-primary transition-colors">
        <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Play className="text-white" size={36} />
        </div>
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold flex items-center">
          <Star size={12} className="text-kz-secondary mr-1" /> {anime.score}
        </div>
      </div>
      <h3 className="font-bold text-kz-text group-hover:text-kz-primary transition-colors line-clamp-1">{anime.title}</h3>
      <p className="text-kz-muted text-sm">{anime.status}</p>
    </Link>
  );
};
