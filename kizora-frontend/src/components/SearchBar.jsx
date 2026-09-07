import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Star, ArrowRight } from 'lucide-react';
import { fetchSearchResults } from '../services/api';

const SearchBar = ({ className = '', placeholder = 'Search anime, genre, titles...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search fetch
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSearchResults(query.trim());
        setSuggestions(results.slice(0, 6));
        setIsOpen(true);
      } catch (err) {
        console.warn('Search suggestions error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectAnime = (animeId) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/anime/${animeId}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
        />

        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-[var(--text-muted)]" />
        )}

        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
          {suggestions.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Top Suggestions
              </div>
              {suggestions.map((anime) => (
                <div
                  key={anime._id || anime.malId}
                  onClick={() => handleSelectAnime(anime._id || anime.malId)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                >
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-9 h-12 rounded object-cover flex-shrink-0 bg-[var(--bg-elevated)]"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                      {anime.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {anime.releaseYear && <span>{anime.releaseYear}</span>}
                      {anime.type && <span>• {anime.type}</span>}
                      {anime.score && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {anime.score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border-t border-[var(--border)] text-xs font-medium text-[var(--accent-hover)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <span>View all results for "{query}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !loading && query.trim().length >= 2 ? (
            <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
