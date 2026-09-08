import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Button } from '../components/common/Button';
import { useWatchHistory } from '../hooks/useStorage';

const HomeSection = ({ title, fetcher, layout = 'vertical', className = '' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetcher();
        if (isMounted) setData(result || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [fetcher]);

  if (error) return null; // Silently hide failed sections
  if (!loading && data.length === 0) return null;

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className={`grid gap-4 ${
        layout === 'horizontal' 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      }`}>
        {loading 
          ? Array(layout === 'horizontal' ? 4 : 5).fill(0).map((_, i) => (
              <Skeleton key={i} className={layout === 'horizontal' ? 'h-48' : 'aspect-[3/4]'} />
            ))
          : data.slice(0, 10).map(anime => (
              <AnimeCard key={anime.id} anime={anime} layout={layout} />
            ))
        }
      </div>
    </section>
  );
};

export const Home = () => {
  const [spotlight, setSpotlight] = useState([]);
  const [loadingSpotlight, setLoadingSpotlight] = useState(true);
  const { history } = useWatchHistory();

  useEffect(() => {
    const fetchSpotlightData = async () => {
      try {
        const spot = await animeService.getSpotlight();
        setSpotlight(spot || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSpotlight(false);
      }
    };
    fetchSpotlightData();
  }, []);

  const heroAnime = spotlight.length > 0 ? spotlight[0] : null;

  // Derive continue watching from history
  const continueWatchingData = history.map(h => ({
    id: h.animeId,
    title: h.animeTitle,
    coverImage: h.poster,
    status: `Episode ${h.episodeNumber}`,
    type: 'History',
    score: `${h.progress}%`,
    targetUrl: `/watch/${h.animeId}/${h.episodeNumber}`
  }));

  // Create fetchers
  const getTrending = () => animeService.getTrending();
  const getPopular = () => animeService.getPopular();
  const getRecent = () => animeService.getTopAiring();
  
  // Create recommendation fetcher based on last watched
  const getRecommendations = () => {
    if (history.length > 0) {
      return animeService.getRecommendations(history[0].animeId);
    }
    return animeService.getPopular();
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-lg overflow-hidden h-[400px] md:h-[500px]">
        {loadingSpotlight ? (
          <Skeleton className="w-full h-full" />
        ) : (
          heroAnime && (
            <>
              <img src={heroAnime.bannerImage} alt={heroAnime.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-kz-bg via-kz-bg/60 to-transparent flex items-end p-6 md:p-12">
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="bg-kz-primary text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Spotlight #1</span>
                    <span className="text-kz-text/80 text-sm">{heroAnime.genres.join(' • ')}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">{heroAnime.title}</h2>
                  <p className="text-kz-text/80 mb-6 line-clamp-2 md:line-clamp-3">{heroAnime.synopsis}</p>
                  <div className="flex space-x-4">
                    <Link to={`/anime/${heroAnime.id}`}>
                      <Button className="pl-3 bg-kz-primary hover:bg-blue-600 border-transparent text-white">
                        <Play size={20} className="mr-2 fill-current" /> Watch Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </section>

      {continueWatchingData.length > 0 && (
        <HomeSection 
          title="Continue Watching" 
          fetcher={async () => continueWatchingData} 
          layout="horizontal" 
        />
      )}

      <HomeSection title="Trending Now" fetcher={getTrending} />
      <HomeSection title="All-Time Popular" fetcher={getPopular} />
      <HomeSection title="Recent Releases" fetcher={getRecent} layout="horizontal" />
      
      {history.length > 0 && (
        <HomeSection title="Recommended For You" fetcher={getRecommendations} />
      )}
    </div>
  );
};
