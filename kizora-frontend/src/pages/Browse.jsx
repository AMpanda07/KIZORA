import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { fetchAnimeList, fetchGenres } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { AnimeGridSkeleton } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';

const STATUS_OPTIONS = ['All', 'Ongoing', 'Completed', 'Upcoming'];
const TYPE_OPTIONS = ['All', 'TV', 'Movie', 'OVA', 'Special'];
const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity' },
  { label: 'Highest Score', value: 'score' },
  { label: 'Alphabetical', value: 'title' },
  { label: 'Newest First', value: 'year' },
];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || 'All';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedGenre, setSelectedGenre] = useState(genreParam);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');

  const [genres, setGenres] = useState([]);
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync params with state
  useEffect(() => {
    if (queryParam !== searchQuery) setSearchQuery(queryParam);
    if (genreParam !== selectedGenre) setSelectedGenre(genreParam);
  }, [queryParam, genreParam]);

  // Load genres list
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const list = await fetchGenres();
        setGenres(list || []);
      } catch (e) {
        console.warn('Failed to load genres', e);
      }
    };
    loadGenres();
  }, []);

  // Fetch anime catalogue
  useEffect(() => {
    let isMounted = true;
    const loadCatalogue = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAnimeList({
          q: searchQuery.trim(),
          genre: selectedGenre !== 'All' ? selectedGenre : undefined,
          type: selectedType !== 'All' ? selectedType : undefined,
        });

        if (isMounted) {
          let list = res.data || [];

          // Status filter
          if (selectedStatus !== 'All') {
            list = list.filter((item) =>
              item.status?.toLowerCase().includes(selectedStatus.toLowerCase())
            );
          }

          // In-memory sorting
          list.sort((a, b) => {
            if (sortBy === 'score') {
              return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
            }
            if (sortBy === 'title') {
              return (a.title || '').localeCompare(b.title || '');
            }
            if (sortBy === 'year') {
              return (b.releaseYear || 0) - (a.releaseYear || 0);
            }
            // default popularity: retain order
            return 0;
          });

          setAnimeList(list);
          setLoading(false);
        }
      } catch (err) {
        console.error('Catalogue error:', err);
        if (isMounted) {
          setError('Failed to fetch anime catalogue. Please try again.');
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(loadCatalogue, 250);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, selectedGenre, selectedStatus, selectedType, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchQuery.trim()) {
        next.set('q', searchQuery.trim());
      } else {
        next.delete('q');
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedStatus('All');
    setSelectedType('All');
    setSortBy('popularity');
    setSearchParams({});
  };

  const activeFilterCount =
    (selectedGenre !== 'All' ? 1 : 0) +
    (selectedStatus !== 'All' ? 1 : 0) +
    (selectedType !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const FilterPanelContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter Catalogue
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-[var(--accent-hover)] hover:underline"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Genres */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Genre
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          <button
            onClick={() => setSelectedGenre('All')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedGenre === 'All'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.id || g.name}
              onClick={() => setSelectedGenre(g.name)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedGenre === g.name
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Format / Type */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sort order */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Sort By
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors truncate ${
                sortBy === opt.value
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Anime Catalogue
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Explore thousands of anime series, movies, and specials
          </p>
        </div>

        {/* Mobile Filter trigger button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>
        </div>
      </div>

      {/* ── Layout Grid: Filters Sidebar + Anime Grid ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] sticky top-20">
          <FilterPanelContent />
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0">
          {/* Active Filter summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">
                {animeList.length} titles found
              </span>
              {selectedGenre !== 'All' && (
                <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent-hover)] font-medium">
                  {selectedGenre}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Sort:</span>
              <span className="font-medium text-[var(--text-primary)] capitalize">
                {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              </span>
            </div>
          </div>

          {/* Anime Grid / States */}
          {loading ? (
            <AnimeGridSkeleton count={12} />
          ) : error ? (
            <ErrorState
              title="Unable to load anime"
              message={error}
              onRetry={() => window.location.reload()}
            />
          ) : animeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {animeList.map((anime) => (
                <AnimeCard key={anime._id || anime.malId} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                No matching anime found
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Try selecting a different genre or clearing your search filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Filter Bottom Sheet / Modal ─────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[var(--bg-surface)] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Filter Catalogue
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterPanelContent />

            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;
