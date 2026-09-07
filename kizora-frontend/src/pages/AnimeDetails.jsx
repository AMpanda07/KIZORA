import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Star, BookmarkPlus } from 'lucide-react';
import { animeService } from '../services/animeService';
import { useWatchlist } from '../hooks/useStorage';
import { EpisodeList } from '../components/domain/EpisodeList';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Button } from '../components/common/Button';

export const AnimeDetails = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const inWatchlist = anime ? isInWatchlist(anime.id) : false;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [animeData, episodesData] = await Promise.all([
          animeService.getAnime(id),
          animeService.getEpisodes(id)
        ]);
        setAnime(animeData);
        setEpisodes(episodesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (error) return <ErrorState message={error} />;
  
  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="w-full h-[400px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Skeleton className="h-[400px]" />
          <div className="md:col-span-3 space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative h-[300px] md:h-[400px] rounded overflow-hidden">
        <img src={anime.bannerImage} alt={`${anime.title} banner`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-kz-bg via-kz-bg/20 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-0 -mt-24 md:-mt-32 relative z-10">
        {/* Sidebar */}
        <div className="space-y-4">
          <img src={anime.coverImage} alt={anime.title} className="w-full rounded border-4 border-kz-bg shadow-lg" />
          <Button variant="primary" className="w-full" onClick={() => toggleWatchlist(anime)}>
            <BookmarkPlus size={18} className="mr-2" /> {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </Button>
          <div className="bg-kz-surface p-4 rounded border border-kz-border text-sm space-y-2">
            <div className="flex justify-between"><span className="text-kz-muted">Score</span><span className="font-bold flex items-center"><Star size={14} className="text-kz-secondary mr-1"/>{anime.score}</span></div>
            <div className="flex justify-between"><span className="text-kz-muted">Status</span><span className="font-medium">{anime.status}</span></div>
            <div className="flex justify-between"><span className="text-kz-muted">Episodes</span><span className="font-medium">{anime.totalEpisodes || anime.episodes}</span></div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-8 mt-12 md:mt-0">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{anime.title}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {anime.genres.map(g => (
                <span key={g} className="bg-kz-surface px-3 py-1 rounded text-sm text-kz-muted border border-kz-border">{g}</span>
              ))}
            </div>
            <p className="text-lg leading-relaxed text-kz-text/80">{anime.synopsis}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Episodes</h2>
            <EpisodeList episodes={episodes} animeId={anime.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
