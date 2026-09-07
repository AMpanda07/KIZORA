import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Search as SearchIcon, Filter, RefreshCw } from 'lucide-react';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const selectedGenre = searchParams.get('genre') || '';
  const selectedType = searchParams.get('type') || '';

  const [results, setResults] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load genre options once
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreList = await animeService.getGenres();
        setGenres(genreList || []);
      } catch (e) {
        console.warn('Failed to load genre filters', e);
      }
    };
    loadGenres();
  }, []);

  // Execute search whenever query, genre, or type changes
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await animeService.searchAnime(query, selectedGenre, selectedType);
        setResults(data || []);
      } catch (err) {
        setError(err.message || 'Failed to search anime.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, selectedGenre, selectedType]);

  const handleGenreChange = (e) => {
    const genre = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (genre) newParams.set('genre', genre);
    else newParams.delete('genre');
    setSearchParams(newParams);
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (type) newParams.set('type', type);
    else newParams.delete('type');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-kz-border/50 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <SearchIcon className="text-kz-primary" size={28} /> 
            {query ? `Results for "${query}"` : selectedGenre ? `Genre: ${selectedGenre}` : 'Explore Catalog'}
          </h1>
          <p className="text-sm text-kz-muted mt-1">
            {results.length} title{results.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-kz-surface border border-kz-border rounded px-3 py-1.5 text-sm">
            <Filter size={16} className="text-kz-muted" />
            <select
              value={selectedGenre}
              onChange={handleGenreChange}
              className="bg-transparent text-kz-text focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-kz-surface">All Genres</option>
              {genres.map((g) => (
                <option key={g.id || g.name} value={g.name} className="bg-kz-surface">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-kz-surface border border-kz-border rounded px-3 py-1.5 text-sm">
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className="bg-transparent text-kz-text focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-kz-surface">All Formats</option>
              <option value="tv" className="bg-kz-surface">TV Series</option>
              <option value="movie" className="bg-kz-surface">Movie</option>
              <option value="ova" className="bg-kz-surface">OVA</option>
              <option value="special" className="bg-kz-surface">Special</option>
            </select>
          </div>

          {(query || selectedGenre || selectedType) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-kz-muted hover:text-kz-primary transition-colors px-2 py-1.5"
            >
              <RefreshCw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState 
          title="No anime found" 
          description={query ? `No match found for "${query}". Try adjusting filters or search keywords.` : 'No titles available.'} 
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map(anime => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
};
