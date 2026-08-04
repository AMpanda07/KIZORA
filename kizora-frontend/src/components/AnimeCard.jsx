import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star } from 'lucide-react';

const AnimeCard = ({ anime }) => {
  const navigate = useNavigate();
  if (!anime) return null;

  const {
    _id,
    malId,
    title,
    coverImage,
    genres,
    totalEpisodes,
    status,
    releaseYear,
    score
  } = anime;

  const handleClick = () => {
    navigate(`/watch/${_id || malId || '1'}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
        e.currentTarget.style.boxShadow = '0 0 30px -5px rgba(139,92,246,0.45)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
      }}
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: '#09090b' }}>
        <img
          src={coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'}
          alt={title}
          className="w-full h-full object-cover"
          style={{ transition: 'transform 0.5s ease' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'; }}
        />
        {/* Hover overlay with play button */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
          style={{ background: 'linear-gradient(to top, rgba(11,12,16,0.95) 0%, rgba(11,12,16,0.4) 50%, transparent 100%)', transition: 'opacity 0.3s' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              boxShadow: '0 0 25px rgba(139,92,246,0.8)',
              transition: 'transform 0.3s'
            }}>
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* Floating badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {status && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)' }}>
              {status}
            </span>
          )}
          {score && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              <Star className="w-3 h-3 fill-current" />
              {score}
            </span>
          )}
        </div>
      </div>

      {/* Card info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white group-hover:text-purple-300"
          style={{ transition: 'color 0.2s' }}>
          {title}
        </h3>

        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#a1a1aa' }}>
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] mt-auto pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#71717a' }}>
          <span>{totalEpisodes ? `${totalEpisodes} Ep` : 'HD'}</span>
          {releaseYear && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{releaseYear}</span>}
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
