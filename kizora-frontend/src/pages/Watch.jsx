import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Film, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { animeService } from '../services/animeService';
import { VideoPlayer } from '../components/domain/VideoPlayer';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { fetchEpisodeStream } from '../services/api';
import { useWatchHistory } from '../hooks/useStorage';

export const Watch = () => {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [streamData, setStreamData] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [error, setError] = useState(null);

  const { updateProgress } = useWatchHistory();

  // 1. Calculate target episode number deterministically from route param
  const currentEpNum = useMemo(() => {
    if (!episodeId) return 1;
    const parsed = parseInt(episodeId, 10);
    if (!isNaN(parsed) && parsed > 0 && String(parsed) === String(episodeId)) {
      return parsed;
    }
    if (typeof episodeId === 'string' && episodeId.includes('-ep-')) {
      const match = episodeId.match(/-ep-(\d+)/);
      if (match && match[1]) return parseInt(match[1], 10);
    }
    return 1;
  }, [episodeId]);

  // Fetch Anime details and Episode list once per animeId
  useEffect(() => {
    const fetchAnimeAndEpisodes = async () => {
      try {
        setLoading(true);
        setError(null);
        const [animeData, episodesData] = await Promise.all([
          animeService.getAnime(animeId),
          animeService.getEpisodes(animeId)
        ]);
        setAnime(animeData);
        setEpisodes(episodesData || []);
      } catch (err) {
        console.error('Failed to load anime details/episodes:', err);
        setError(err.message || 'Failed to load video player');
      } finally {
        setLoading(false);
      }
    };
    fetchAnimeAndEpisodes();
  }, [animeId]);

  // Fetch Stream data whenever target episode number changes
  useEffect(() => {
    const loadStream = async () => {
      try {
        setStreamLoading(true);
        console.log(`[WATCH] Requesting stream for animeId: ${animeId}, epNum: ${currentEpNum}`);
        const data = await fetchEpisodeStream(animeId, currentEpNum);
        setStreamData(data);
        setActiveSourceIndex(0);
        if (data?.servers && data.servers.length > 0) {
          setActiveServerId(data.servers[0].id || 'default');
        }
      } catch (err) {
        console.error('Stream load error:', err);
        setError(`Unable to load stream for Episode ${currentEpNum}`);
      } finally {
        setStreamLoading(false);
      }
    };
    loadStream();
  }, [animeId, currentEpNum]);

  if (error) return <ErrorState message={error} />;
  
  if (loading || !anime) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <Skeleton className="h-8 w-1/3 rounded" />
      </div>
    );
  }

  // Active episode item in list
  const activeEpisodeObj = episodes.find(
    ep => (ep.number || ep.episodeNumber) === currentEpNum || ep.id === episodeId || ep._id === episodeId
  ) || {
    id: `${animeId}-ep-${currentEpNum}`,
    number: currentEpNum,
    episodeNumber: currentEpNum,
    title: `Episode ${currentEpNum}`,
  };

  const prevEpNum = currentEpNum > 1 ? currentEpNum - 1 : null;
  const maxEp = anime.totalEpisodes || episodes.length || currentEpNum;
  const nextEpNum = currentEpNum < maxEp ? currentEpNum + 1 : null;

  // Selected video URL from sources array or fallback stream url
  const sources = streamData?.sources || [];
  const selectedSource = sources[activeSourceIndex] || sources[0];
  const videoUrl = selectedSource?.url || streamData?.url || '';

  const handleNextEpisode = () => {
    if (nextEpNum) {
      navigate(`/watch/${animeId}/${nextEpNum}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to={`/anime/${animeId}`} className="inline-flex items-center text-kz-muted hover:text-kz-primary transition-colors text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Back to {anime.title}
        </Link>
        <span className="text-xs text-kz-muted font-mono">
          Playing Episode {currentEpNum}
        </span>
      </div>

      {/* Main Layout: Video Player (Left) + Episode Grid (Right on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Player & Stream Controls */}
        <div className="lg:col-span-2 space-y-4">
          {streamLoading ? (
            <div className="w-full aspect-video bg-kz-surface rounded-2xl flex items-center justify-center border border-kz-border">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full animate-spin" />
                <span className="text-sm text-kz-muted">Loading Episode {currentEpNum} Stream...</span>
              </div>
            </div>
          ) : (
            <VideoPlayer 
              videoUrl={videoUrl}
              sources={sources}
              poster={activeEpisodeObj.thumbnail || anime.bannerImage || anime.coverImage}
              title={`${anime.title} - Episode ${currentEpNum}`}
              onTimeUpdate={(currentTime, duration) => {
                updateProgress({
                  animeId: anime.id,
                  episodeNumber: currentEpNum,
                  episodeId: activeEpisodeObj.id || activeEpisodeObj._id || `${animeId}-ep-${currentEpNum}`,
                  animeTitle: anime.title,
                  episodeTitle: activeEpisodeObj.title || `Episode ${currentEpNum}`,
                  poster: anime.coverImage,
                  currentTime,
                  duration
                });
              }}
              onEnded={handleNextEpisode}
            />
          )}

          {/* Episode Info & Navigation Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-kz-surface rounded-xl border border-kz-border">
            <div>
              <h1 className="text-xl font-bold text-kz-text line-clamp-1">{anime.title}</h1>
              <p className="text-kz-primary font-semibold text-sm mt-0.5">
                Episode {currentEpNum}: {activeEpisodeObj.title || `Episode ${currentEpNum}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button 
                onClick={() => prevEpNum && navigate(`/watch/${animeId}/${prevEpNum}`)}
                disabled={!prevEpNum}
                className="flex items-center gap-1 px-3 py-1.5 bg-kz-card hover:bg-kz-border disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded text-kz-text transition-colors border border-kz-border"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              <button 
                onClick={() => nextEpNum && navigate(`/watch/${animeId}/${nextEpNum}`)}
                disabled={!nextEpNum}
                className="flex items-center gap-1 px-3 py-1.5 bg-kz-primary hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded text-white transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Multi-Server Selection Bar */}
          {streamData && (
            <div className="p-4 bg-kz-surface rounded-xl border border-kz-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-kz-muted flex items-center gap-1.5">
                  <Server size={14} className="text-kz-primary" /> Available Servers & Qualities
                </span>
                <span className="text-xs text-kz-muted">Provider: {streamData.provider || 'KIZORA Engine'}</span>
              </div>

              {/* Quality & Server Buttons */}
              <div className="flex flex-wrap gap-2">
                {sources.map((srcItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSourceIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
                      activeSourceIndex === idx
                        ? 'bg-kz-primary/20 border-kz-primary text-kz-primary'
                        : 'bg-kz-card border-kz-border text-kz-muted hover:text-kz-text'
                    }`}
                  >
                    {activeSourceIndex === idx && <Check size={12} />}
                    {srcItem.quality || `Server ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Episode Grid List */}
        <div className="bg-kz-surface p-4 rounded-xl border border-kz-border flex flex-col max-h-[600px] lg:max-h-none">
          <div className="flex items-center justify-between pb-3 border-b border-kz-border mb-3">
            <h3 className="font-bold text-sm text-kz-text flex items-center gap-2">
              <Film size={16} className="text-kz-primary" /> Episode List ({episodes.length || anime.totalEpisodes || 12})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[500px]">
            {(episodes.length > 0 ? episodes : Array.from({ length: anime.totalEpisodes || 12 }, (_, i) => ({
              number: i + 1,
              episodeNumber: i + 1,
              title: `Episode ${i + 1}`
            }))).map((ep) => {
              const epNum = ep.number || ep.episodeNumber;
              const isActive = epNum === currentEpNum;

              return (
                <button
                  key={epNum}
                  onClick={() => navigate(`/watch/${animeId}/${epNum}`)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-kz-primary text-white font-bold shadow-md'
                      : 'bg-kz-card/60 hover:bg-kz-card text-kz-text border border-kz-border/30'
                  }`}
                >
                  <span className="truncate pr-2">
                    Ep {epNum}: {ep.title || `Episode ${epNum}`}
                  </span>
                  {isActive && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-white/20 rounded">Playing</span>}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
