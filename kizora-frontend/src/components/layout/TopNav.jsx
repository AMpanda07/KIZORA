import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, Star, X } from 'lucide-react';
import { Input } from '../common/Input';
import { animeService } from '../../services/animeService';

export const TopNav = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await animeService.searchAnime(query.trim());
        setSuggestions(results.slice(0, 6));
        setShowDropdown(true);
      } catch (err) {
        console.error('Search suggestion error:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (animeId) => {
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setQuery('');
    navigate(`/anime/${animeId}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-kz-bg/95 backdrop-blur border-b border-kz-border h-16 flex items-center justify-between px-4 md:px-8">
      {/* Brand Header for Mobile */}
      <div className="flex items-center gap-3 md:hidden">
        <Link to="/" className="text-xl font-black tracking-wider text-kz-primary">
          KIZORA
        </Link>
      </div>

      {/* Desktop Search Bar */}
      <div className="relative flex-1 max-w-xl mx-auto hidden md:block" ref={searchRef}>
        <form onSubmit={handleSearchSubmit}>
          <Input 
            icon={isLoading ? <Loader2 size={18} className="animate-spin text-kz-primary" /> : <Search size={18} />} 
            placeholder="Search anime title, genre..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          />
        </form>

        {/* Dropdown Suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-kz-surface border border-kz-border rounded-lg shadow-2xl overflow-hidden z-50">
            <div className="p-2 border-b border-kz-border/50 text-xs font-semibold text-kz-muted uppercase tracking-wider">
              Search Suggestions
            </div>
            <div className="divide-y divide-kz-border/30 max-h-[380px] overflow-y-auto">
              {suggestions.map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => handleSelectSuggestion(anime.id)}
                  className="flex items-center gap-3 p-2.5 hover:bg-kz-card cursor-pointer transition-colors"
                >
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-10 h-14 object-cover rounded flex-shrink-0 bg-kz-bg"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-kz-text truncate group-hover:text-kz-primary">
                      {anime.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-kz-muted">
                      <span>{anime.releaseYear || 'N/A'}</span>
                      <span>•</span>
                      <span>{anime.type || 'TV'}</span>
                      {anime.score && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-yellow-400">
                            <Star size={12} fill="currentColor" />
                            {anime.score}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSearchSubmit}
              className="w-full text-center py-2 bg-kz-card hover:bg-kz-border text-xs text-kz-primary font-medium border-t border-kz-border transition-colors"
            >
              View all results for "{query}"
            </button>
          </div>
        )}
      </div>

      {/* Mobile Search Icon & Modal Toggle */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="p-2 text-kz-muted hover:text-kz-text focus:outline-none"
          aria-label="Toggle search"
        >
          {mobileSearchOpen ? <X size={22} /> : <Search size={22} />}
        </button>
      </div>

      {/* Mobile Expandable Search Bar */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-kz-surface border-b border-kz-border p-3 z-40 md:hidden shadow-xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input 
              icon={isLoading ? <Loader2 size={18} className="animate-spin text-kz-primary" /> : <Search size={18} />} 
              placeholder="Search anime..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </form>

          {suggestions.length > 0 && (
            <div className="mt-2 divide-y divide-kz-border/30 max-h-[280px] overflow-y-auto">
              {suggestions.map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => handleSelectSuggestion(anime.id)}
                  className="flex items-center gap-3 p-2 hover:bg-kz-card cursor-pointer"
                >
                  <img src={anime.coverImage} alt={anime.title} className="w-9 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-kz-text truncate">{anime.title}</div>
                    <div className="text-xs text-kz-muted">{anime.releaseYear} • {anime.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
