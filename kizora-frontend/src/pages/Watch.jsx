import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAnimeInfo, fetchEpisodeStream } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import {
  Play,
  Star,
  Eye,
  Calendar,
  Sparkles,
  Film,
  Loader2,
  Server,
  ArrowLeft,
  AlertTriangle,
  Tv,
  Clock,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useWatchlist, useWatchHistory } from '../hooks/useStorage';

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop';

const EpisodeItem = ({ ep, activeId, animeId }) => {
  const isActive = ep._id === activeId || ep._id === `${animeId}-ep-${ep.episodeNumber}`;
  return (
    <Link
      to={`/watch/${ep._id}`}
      className={`group flex items-center gap-3 p-2 rounded-xl transition-colors border ${
        isActive
          ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)] text-white'
          : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-focus)]'
      }`}
    >
      <div className="relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-[var(--bg-elevated)]">
        <img
          src={ep.thumbnail || FALLBACK_THUMBNAIL}
          alt={ep.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.target.src = FALLBACK_THUMBNAIL;
          }}
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-3.5 h-3.5 text-white fill-current" />
        </div>
        {isActive && (
          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] font-bold bg-[var(--accent-primary)] text-white">
            NOW
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold block truncate">
          Episode {ep.episodeNumber}
        </span>
        <p className="text-[10px] text-[var(--text-muted)] truncate">
          {ep.title || `Episode ${ep.episodeNumber}`}
        </p>
      </div>
    </Link>
  );
};

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();

  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { updateProgress } = useWatchHistory();

  const [animeInfo, setAnimeInfo] = useState(null);
  const [streamSources, setStreamSources] = useState([]);
  const [servers, setServers] = useState([]);
  const [selectedServerUrl, setSelectedServerUrl] = useState(null);
  const [activeProviderName, setActiveProviderName] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [loading, setLoading] = useState(true);

  const [animeError, setAnimeError] = useState(false);
  const [streamError, setStreamError] = useState(false);

  // Decompose compound ID
  const parts = (episodeId || '21-ep-1').split('-ep-');
  const animeId = parts[0];
  const epNum = parts[1] ? parseInt(parts[1], 10) : 1;

  const loadStreamAndMeta = async () => {
    setLoading(true);
    setAnimeError(false);
    setStreamError(false);
    setSelectedServerUrl(null);
    setActiveProviderName('');

    try {
      const [streamRes, infoRes] = await Promise.allSettled([
        fetchEpisodeStream(animeId, epNum),
        fetchAnimeInfo(animeId),
      ]);

      // Stream sources resolution
      if (streamRes.status === 'fulfilled' && streamRes.value) {
        const streamData = streamRes.value;
        setActiveProviderName(streamData.provider || '');
        if (streamData.isIframe && streamData.url) {
          setStreamSources([{ url: streamData.url, isIframe: true }]);
          setServers(streamData.servers || []);
          setSelectedServerUrl(streamData.url);
          setStreamError(false);
        } else if (streamData.sources?.length) {
          setStreamSources(streamData.sources);
          setServers(streamData.servers || []);
          setSelectedServerUrl(streamData.sources[0]?.url || streamData.url);
          setStreamError(false);
        } else {
          setStreamSources([]);
          setStreamError(true);
        }
      } else {
        setStreamSources([]);
        setStreamError(true);
      }

      // Metadata & episode list resolution
      let info = null;
      if (infoRes.status === 'fulfilled' && infoRes.value) {
        info = infoRes.value;
        setAnimeInfo(info);
      } else {
        setAnimeError(true);
      }

      const total = info?.totalEpisodes || 24;
      const fallbackThumb = info?.bannerImage || info?.coverImage || FALLBACK_THUMBNAIL;
      const epList = Array.from({ length: total }, (_, i) => ({
        _id: `${animeId}-ep-${i + 1}`,
        episodeNumber: i + 1,
        title: `Episode ${i + 1}`,
        thumbnail: fallbackThumb,
      }));
      setEpisodes(epList);

      const activeEp = {
        _id: `${animeId}-ep-${epNum}`,
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        thumbnail: fallbackThumb,
      };
      setCurrentEpisode(activeEp);

      // Save initial history progress
      updateProgress({
        animeId,
        episodeNumber: epNum,
        episodeId,
        animeTitle: info?.title || `Anime ${animeId}`,
        episodeTitle: `Episode ${epNum}`,
        poster: info?.coverImage || fallbackThumb,
        currentTime: 0,
        duration: 1440,
      });
    } catch (err) {
      console.error('Watch loading error:', err);
      setStreamError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (episodeId) {
      loadStreamAndMeta();
    }
  }, [episodeId]);

  const activeStreamUrl =
    selectedServerUrl || (streamSources.length > 0 ? streamSources[0].url : null);
  const animeTitle = animeInfo?.title || `Anime ${animeId}`;
  const isBookmarked = isInWatchlist(animeId);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* ── Breadcrumb bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-4">
        <button
          onClick={() => navigate(`/anime/${animeId}`)}
          className="hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Anime Details</span>
        </button>
        <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="text-[var(--text-primary)] font-medium truncate max-w-xs">
          {animeTitle}
        </span>
        <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="text-[var(--accent-hover)] font-semibold">
          Ep {epNum}
        </span>
      </div>

      {/* ── Main Layout: Video + Episodes Sidebar ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Left Column: Video Player & Info ─────────────────────── */}
        <div className="space-y-4">
          {/* Player Container maintaining 16:9 */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[var(--border)] shadow-2xl">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[var(--bg-card)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                <p className="text-xs text-[var(--text-secondary)]">
                  Resolving stream for Episode {epNum}...
                </p>
              </div>
            ) : streamError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-card)]">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-1">
                  Stream Unavailable
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                  All upstream providers for Episode {epNum} are currently offline or rate-limited.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={loadStreamAndMeta}
                    className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Stream
                  </button>
                  <button
                    onClick={() => navigate(`/anime/${animeId}`)}
                    className="btn-secondary px-4 py-2 rounded-lg text-xs font-medium"
                  >
                    Back to Anime
                  </button>
                </div>
              </div>
            ) : streamSources[0]?.isIframe ? (
              <iframe
                src={activeStreamUrl}
                title={`Episode ${epNum}`}
                className="w-full h-full border-0"
                allowFullScreen
              />
            ) : (
              <VideoPlayer
                videoUrl={activeStreamUrl}
                sources={streamSources}
                servers={servers}
                poster={currentEpisode?.thumbnail || animeInfo?.coverImage}
                title={`Episode ${epNum} - ${animeTitle}`}
              />
            )}
          </div>

          {/* Server Switcher Bar */}
          {servers.length > 0 && !streamError && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 mr-1">
                <Server className="w-3.5 h-3.5" />
                Source:
              </span>
              {servers.map((srv, idx) => {
                const isSelected = activeStreamUrl === srv.url;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedServerUrl(srv.url);
                      if (srv.isIframe) {
                        setStreamSources([{ url: srv.url, isIframe: true }]);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {srv.name || `Server ${idx + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Prev / Next Episode Controls Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <button
              disabled={epNum <= 1}
              onClick={() => navigate(`/watch/${animeId}-ep-${epNum - 1}`)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-[var(--text-primary)]">
              Episode {epNum} {animeInfo?.totalEpisodes && `of ${animeInfo.totalEpisodes}`}
            </span>

            <button
              disabled={Boolean(animeInfo?.totalEpisodes && epNum >= animeInfo.totalEpisodes)}
              onClick={() => navigate(`/watch/${animeId}-ep-${epNum + 1}`)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Anime Information Under Player */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-xl font-bold text-[var(--text-primary)]">
                  {animeTitle}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Episode {epNum} &bull; {animeInfo?.type || 'TV Series'}
                </p>
              </div>

              <button
                onClick={() => animeInfo && toggleWatchlist(animeInfo)}
                className="btn-secondary inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium"
              >
                {isBookmarked ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>In Watchlist</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Add to Watchlist</span>
                  </>
                )}
              </button>
            </div>

            {animeInfo?.synopsis && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3 pt-2 border-t border-[var(--border-subtle)]">
                {animeInfo.synopsis}
              </p>
            )}
          </div>
        </div>

        {/* ── Right Column: Episode List Sidebar ───────────────────── */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex flex-col max-h-[560px] lg:sticky lg:top-20">
          <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-[var(--accent-hover)]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Episodes ({episodes.length})
              </h3>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">Select to Play</span>
          </div>

          <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1">
            {episodes.map((ep) => (
              <EpisodeItem
                key={ep._id}
                ep={ep}
                activeId={episodeId}
                animeId={animeId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
