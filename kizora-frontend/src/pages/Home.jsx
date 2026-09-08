import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { animeService } from '../services/animeService';
import { AnimeCard } from '../components/domain/AnimeCard';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Button } from '../components/common/Button';

export const Home = () => {
  const [spotlight, setSpotlight] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topAiring, setTopAiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [spot, trend, top] = await Promise.all([
        animeService.getSpotlight(),
        animeService.getTrending(),
        animeService.getTopAiring()
      ]);
      const s = spot || [];
      const t = trend || [];
      const topA = top || [];
      if (s.length === 0 && t.length === 0 && topA.length === 0) {
        setError('Unable to load trending anime.');
        return;
      }
      setSpotlight(s);
      setTrending(t);
      setTopAiring(topA);
    } catch (err) {
      setError(err.message || 'Unable to load trending anime.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const heroAnime = spotlight.length > 0 ? spotlight[0] : trending[0];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-lg overflow-hidden h-[400px] md:h-[500px]">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          heroAnime && (
            <>
              <img src={heroAnime.bannerImage} alt={heroAnime.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-kz-bg via-kz-bg/60 to-transparent flex items-end p-6 md:p-12">
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="bg-kz-primary text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Trending #1</span>
                    <span className="text-kz-text/80 text-sm">{heroAnime.genres.join(' • ')}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">{heroAnime.title}</h2>
                  <p className="text-kz-text/80 mb-6 line-clamp-2 md:line-clamp-3">{heroAnime.synopsis}</p>
                  <div className="flex space-x-4">
                    <Link to={`/anime/${heroAnime.id}`}>
                      <Button className="pl-3">
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

      {/* Trending Carousel */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading 
            ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)
            : trending.map(anime => <AnimeCard key={anime.id} anime={anime} />)
          }
        </div>
      </section>

      {/* Top Airing */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Top Airing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading 
            ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)
            : topAiring.map(anime => <AnimeCard key={anime.id} anime={anime} layout="horizontal" />)
          }
        </div>
      </section>
    </div>
  );
};
