import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Heart } from 'lucide-react';

const AnimeCard = ({ anime, variant = 'default' }) => {
  const navigate = useNavigate();
  if (!anime) return null;

  const { _id, malId, title, coverImage, genres, totalEpisodes, status, releaseYear, score } = anime;

  const handleClick = () => {
    navigate(`/watch/${_id || malId || '1'}-ep-1`);
  };

  // ── Compact horizontal variant (for top-ranked sidebar list) ──────────────
  if (variant === 'rank') {
    return (
      <div
        onClick={handleClick}
        className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all duration-200"
        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid transparent' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
          e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(124,58,237,0.05)';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <div className="relative flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden" style={{ background: '#1A1030' }}>
          <img
            src={coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400'}
            alt={title}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400'; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-300 transition-colors leading-tight">
            {title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            {score && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: '#F59E0B' }}>
                <Star className="w-2.5 h-2.5 fill-current" />
                {score}
              </span>
            )}
            {genres && genres[0] && (
              <span className="text-[10px]" style={{ color: '#7B6EA8' }}>• {genres[0]}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Default poster card variant ───────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(26, 16, 48, 0.8)',
        border: '1px solid rgba(124,58,237,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-7px) scale(1.02)';
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)';
        e.currentTarget.style.boxShadow = '0 0 35px -5px rgba(124,58,237,0.55)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)';
      }}
    >
      {/* Cover image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: '#0F0A1E' }}>
        <img
          src={coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          style={{ transition: 'transform 0.5s ease' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800'; }}
        />

        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4"
          style={{ background: 'linear-gradient(to top, rgba(15,10,30,0.97) 0%, rgba(15,10,30,0.4) 50%, transparent 100%)' }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #C026D3)', boxShadow: '0 0 25px rgba(124,58,237,0.8)' }}
          >
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* Wishlist / Bookmark button */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: 'rgba(15,10,30,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(124,58,237,0.3)' }}
          onClick={e => { e.stopPropagation(); }}
        >
          <Heart className="w-3.5 h-3.5" style={{ color: '#C026D3' }} />
        </button>

        {/* Status badge */}
        {status && (
          <div className="absolute top-2.5 left-2.5">
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: status === 'Ongoing' ? 'rgba(6,182,212,0.2)' : 'rgba(124,58,237,0.2)',
                border: `1px solid ${status === 'Ongoing' ? 'rgba(6,182,212,0.5)' : 'rgba(124,58,237,0.4)'}`,
                color: status === 'Ongoing' ? '#06B6D4' : '#A78BFA',
                backdropFilter: 'blur(8px)',
              }}
            >
              {status}
            </span>
          </div>
        )}

        {/* Score badge */}
        {score && (
          <div className="absolute bottom-2.5 right-2.5">
            <span
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: '#F59E0B' }}
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              {score}
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3
          className="font-bold text-sm leading-tight line-clamp-2 transition-colors duration-200"
          style={{ color: '#E2D9F3' }}
        >
          {title}
        </h3>

        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 2).map((g, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center justify-between text-[10px] pt-1.5"
          style={{ borderTop: '1px solid rgba(124,58,237,0.1)', color: '#7B6EA8' }}
        >
          <span>{totalEpisodes ? `${totalEpisodes} Eps` : 'HD'}</span>
          {releaseYear && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{releaseYear}</span>}
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
