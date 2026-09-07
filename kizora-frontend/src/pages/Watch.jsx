import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { animeService } from '../services/animeService';
import { VideoPlayer } from '../components/domain/VideoPlayer';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { fetchEpisodeStream } from '../services/api';
import { useWatchHistory } from '../hooks/useStorage';

export const Watch = () => {
  const { animeId, episodeId } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { updateProgress } = useWatchHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [animeData, episodesData] = await Promise.all([
          animeService.getAnime(animeId),
          animeService.getEpisodes(animeId)
        ]);
        setAnime(animeData);
        setEpisodes(episodesData);
        
        // Find the specific episode number to fetch the stream correctly
        const currentEp = episodesData.find(ep => ep.id === episodeId || ep._id === episodeId);
        const epNum = currentEp?.number || currentEp?.episodeNumber || 1;
        
        const stream = await fetchEpisodeStream(animeId, epNum);
        setStreamData(stream);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [animeId, episodeId]);

  if (error) return <ErrorState message={error} />;
  
  if (loading || !anime || !streamData) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-full aspect-video" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    );
  }

  const currentEpisodeIndex = episodes.findIndex(ep => ep.id === episodeId || ep._id === episodeId);
  const currentEpisode = episodes[currentEpisodeIndex] || episodes[0];
  
  const prevEpisode = currentEpisodeIndex > 0 ? episodes[currentEpisodeIndex - 1] : null;
  const nextEpisode = currentEpisodeIndex < episodes.length - 1 ? episodes[currentEpisodeIndex + 1] : null;
  
  // Extract default video URL and sources from streamData
  const defaultSource = streamData.sources?.find(s => s.quality === 'default' || s.quality === 'auto') || streamData.sources?.[0];
  const videoUrl = defaultSource?.url || streamData.url;

  return (
    <div className="max-w-6xl mx-auto">
      <Link to={`/anime/${animeId}`} className="inline-flex items-center text-kz-muted hover:text-kz-primary mb-4 transition-colors">
        <ArrowLeft size={18} className="mr-2" /> Back to Anime
      </Link>
      
      <VideoPlayer 
        videoUrl={videoUrl}
        sources={streamData.sources}
        poster={currentEpisode.thumbnail || anime.bannerImage}
        title={`Episode ${currentEpisode.number || currentEpisode.episodeNumber}: ${currentEpisode.title}`}
        onTimeUpdate={(currentTime, duration) => {
          updateProgress({
            animeId: anime.id,
            episodeNumber: currentEpisode.number || currentEpisode.episodeNumber,
            episodeId: currentEpisode.id || currentEpisode._id,
            animeTitle: anime.title,
            episodeTitle: currentEpisode.title,
            poster: anime.coverImage,
            currentTime,
            duration
          });
        }}
      />

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{anime.title}</h1>
          <p className="text-kz-muted text-lg mt-1">Episode {currentEpisode.number}: {currentEpisode.title}</p>
        </div>
        
        <div className="flex space-x-2">
          {prevEpisode ? (
            <Link to={`/watch/${animeId}/${prevEpisode.id}`} className="px-4 py-2 bg-kz-surface hover:bg-kz-card rounded text-kz-text transition-colors border border-kz-border">
              Prev
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-kz-surface rounded text-kz-muted border border-kz-border opacity-50 cursor-not-allowed">
              Prev
            </button>
          )}
          
          {nextEpisode ? (
            <Link to={`/watch/${animeId}/${nextEpisode.id}`} className="px-4 py-2 bg-kz-primary hover:bg-blue-600 rounded text-white transition-colors">
              Next
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-kz-surface rounded text-kz-muted border border-kz-border opacity-50 cursor-not-allowed">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
