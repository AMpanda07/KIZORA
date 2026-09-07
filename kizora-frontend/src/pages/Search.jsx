import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Search as SearchIcon } from 'lucide-react';

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await animeService.searchAnime(query);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <SearchIcon className="mr-3 text-kz-primary" size={28} /> 
        {query ? `Search Results for "${query}"` : 'Browse All Anime'}
      </h1>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState 
          title="No results found" 
          description={`We couldn't find any anime matching "${query}". Try adjusting your search.`} 
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
