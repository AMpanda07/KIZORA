import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAnimeInfo, fetchEpisodes, fetchStreamSources } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import {
  Play, Star, Eye, Calendar, Sparkles, Film,
  Loader2, Server, ArrowLeft, AlertTriangle,
  Tv, Clock, ChevronRight, BookMarked
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop';

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
const PlayerSkeleton = () => (
  <div
    className="w-full skeleton"
    style={{ aspectRatio: '16/9', borderRadius: '16px', border: '1px solid rgba(124,58,237,0.15)' }}
  />
);

const EpisodeSkeleton = () => (
  <div className="flex gap-3 p-3 rounded-2xl" style={{ background: 'rgba(124,58,237,0.05)' }}>
    <div className="skeleton flex-shrink-0 rounded-xl" style={{ width: '112px', aspectRatio: '16/9' }} />
    <div className="flex-1 flex flex-col gap-2 justify-center">
      <div className="skeleton h-3 rounded" style={{ width: '40%' }} />
      <div className="skeleton h-3 rounded" style={{ width: '85%' }} />
    </div>
  </div>
);

// ─── Episode List Item ────────────────────────────────────────────────────────
const EpisodeItem = ({ ep, activeId }) => {
  const isActive = ep._id === activeId;
  return (
    <Link
      to={`/watch/${ep._id}`}
      className="group flex gap-3 p-3 rounded-2xl transition-all duration-200"
      style={{
        background: isActive ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.04)',
        border: `1px solid ${isActive ? 'rgba(124,58,237,0.45)' : 'rgba(124,58,237,0.1)'}`,
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.1)'; } }}
    >
      {/* Thumbnail */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-xl"
        style={{ width: '112px', aspectRatio: '16/9', background: '#1A1030' }}
      >
        <img
          src={ep.thumbnail || FALLBACK_THUMBNAIL}
          alt={ep.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = FALLBACK_THUMBNAIL; }}
        />
        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(15,10,30,0.6)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #C026D3)' }}
          >
            <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
          </div>
        </div>
        {/* Duration badge */}
        <span
          className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{ background: 'rgba(0,0,0,0.8)', color: '#D4D4D8' }}
        >
          {ep.duration || '24:00'}
        </span>
        {/* Active indicator */}
        {isActive && (
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
            style={{ background: 'rgba(124,58,237,0.9)', color: '#fff' }}
          >
            Now
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
        <span className="text-[11px] font-bold" style={{ color: isActive ? '#C4B5FD' : '#8B5CF6' }}>
          Episode {ep.episodeNumber}
        </span>
        <h4
          className="text-xs font-semibold line-clamp-2 leading-snug transition-colors"
          style={{ color: isActive ? '#E2D9F3' : '#A1A1AA' }}
        >
          {ep.title}
        </h4>
      </div>
    </Link>
  );
};

// ─── Watch Page ───────────────────────────────────────────────────────────────
const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();

  const [animeInfo,       setAnimeInfo]       = useState(null);
  const [streamSources,   setStreamSources]   = useState([]);
  const [servers,         setServers]         = useState([]);
  const [episodes,        setEpisodes]        = useState([]);
  const [currentEpisode,  setCurrentEpisode]  = useState(null);
  const [loading,         setLoading]         = useState(true);
  
  // Discrete Error States
  const [animeError,      setAnimeError]      = useState(false);
  const [episodesError,   setEpisodesError]   = useState(false);
  const [streamError,     setStreamError]     = useState(false);

  // ── Fetch all data whenever the URL id changes ─────────────────────────────
  useEffect(() => {
    if (!episodeId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setAnimeError(false);
      setEpisodesError(false);
      setStreamError(false);

      // Decompose compound IDs like "21-ep-3" → animeId = "21"
      const parts   = episodeId.split('-ep-');
      const animeId = parts[0];

      const [streamRes, infoRes, epsRes] = await Promise.allSettled([
        fetchStreamSources(episodeId),
        fetchAnimeInfo(animeId),
        fetchEpisodes(animeId),
      ]);

      if (!mounted) return;

      // ── Stream sources ──
      if (streamRes.status === 'fulfilled' && streamRes.value) {
        const streamData = streamRes.value;
        if (streamData.isIframe && streamData.url) {
          // Iframe payload
          setStreamSources([{ url: streamData.url, isIframe: true }]);
          setServers(streamData.servers || []);
          setStreamError(false);
        } else if (streamData.sources?.length) {
          // Native video payload (.m3u8)
          setStreamSources(streamData.sources);
          setServers(streamData.servers || []);
          setStreamError(false);
        } else {
          setStreamSources([]);
          setStreamError(true);
        }
      } else {
        setStreamSources([]);
        setStreamError(true);
      }

      // ── Anime metadata ──
      if (infoRes.status === 'fulfilled' && infoRes.value) {
        setAnimeInfo(infoRes.value);
        setAnimeError(false);
      } else {
        setAnimeInfo(null);
        setAnimeError(true);
      }

      // ── Episode list ──
      if (epsRes.status === 'fulfilled' && epsRes.value?.length > 0) {
        setEpisodes(epsRes.value);
        const matched = epsRes.value.find(e => e._id === episodeId) || epsRes.value[0];
        setCurrentEpisode(matched || null);
        setEpisodesError(false);
      } else {
        setEpisodes([]);
        setCurrentEpisode(null);
        setEpisodesError(true);
      }

      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [episodeId]);

  // Resolve the stream URL to feed into the player
  const activeStreamUrl = streamSources.length > 0 ? streamSources[0].url : null;

  // Helpers
  const animeId    = (episodeId || '21').split('-ep-')[0];
  const animeTitle = animeInfo?.title || currentEpisode?.animeTitle || 'Loading...';
  const synopsis   = animeInfo?.synopsis || 'No synopsis available.';

  // ── Badge label for stream type ──
  const streamBadge = activeStreamUrl?.includes('.m3u8') ? 'HLS Adaptive Stream' : 'MP4 Stream';

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: '#0F0A1E',
        paddingLeft: '220px',   /* sidebar offset */
        paddingTop:  '73px',    /* header offset */
        paddingBottom: '48px',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* ── Breadcrumb / Back bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200"
            style={{ color: '#7B6EA8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C4B5FD'}
            onMouseLeave={e => e.currentTarget.style.color = '#7B6EA8'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <ChevronRight className="w-3 h-3" style={{ color: '#4B3E7A' }} />

          <span
            className="text-sm font-semibold cursor-pointer transition-colors duration-200"
            style={{ color: '#7B6EA8' }}
            onClick={() => navigate('/')}
            onMouseEnter={e => e.currentTarget.style.color = '#C4B5FD'}
            onMouseLeave={e => e.currentTarget.style.color = '#7B6EA8'}
          >
            {animeTitle}
          </span>

          {currentEpisode && (
            <>
              <ChevronRight className="w-3 h-3" style={{ color: '#4B3E7A' }} />
              <span className="text-sm font-semibold" style={{ color: '#E2D9F3' }}>
                Episode {currentEpisode.episodeNumber}
              </span>
            </>
          )}
        </div>

        {/* ── Fetching indicator (toast) ────────────────────────────────────── */}
        {loading && (
          <div
            className="fixed top-[82px] right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(15,10,30,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#C4B5FD',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)',
            }}
          >
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8B5CF6' }} />
            Fetching stream & metadata...
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
             MAIN GRID: 2fr (video + info) | 1fr (episode list)
        ════════════════════════════════════════════════════════════════════ */}
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}
        >
          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Video player */}
            {loading ? <PlayerSkeleton /> : streamError ? (
              /* Error state */
              <div
                className="w-full flex flex-col items-center justify-center gap-4 rounded-2xl p-12"
                style={{
                  aspectRatio: '16/9',
                  background: 'rgba(26,16,48,0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  boxShadow: '0 0 40px -8px rgba(124,58,237,0.3)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <AlertTriangle className="w-8 h-8" style={{ color: '#EF4444' }} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">Stream Unavailable</h3>
                  <p className="text-sm" style={{ color: '#7B6EA8' }}>
                    The stream for this episode is currently unavailable or the provider timed out.
                  </p>
                </div>
              </div>
            ) : streamSources[0]?.isIframe ? (
              <div 
                className="w-full overflow-hidden rounded-2xl relative"
                style={{
                  aspectRatio: '16/9',
                  border: '1px solid rgba(124,58,237,0.2)',
                  boxShadow: '0 0 40px -8px rgba(124,58,237,0.5)',
                  background: '#000'
                }}
              >
                <iframe
                  src={activeStreamUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title={animeTitle}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                ></iframe>
              </div>
            ) : (
              <VideoPlayer
                videoUrl={activeStreamUrl}
                sources={streamSources}
                servers={servers}
                poster={currentEpisode?.thumbnail || animeInfo?.coverImage || FALLBACK_THUMBNAIL}
                title={currentEpisode ? `Ep ${currentEpisode.episodeNumber} — ${animeTitle}` : animeTitle}
              />
            )}

            {/* ── Anime Info Panel ──────────────────────────────────────────── */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(26,16,48,0.75)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(124,58,237,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {/* Episode meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {currentEpisode && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#C4B5FD' }}
                  >
                    Episode {currentEpisode.episodeNumber}
                  </span>
                )}

                {animeInfo?.status && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: animeInfo.status === 'Ongoing' ? 'rgba(6,182,212,0.12)' : 'rgba(124,58,237,0.12)',
                      border: `1px solid ${animeInfo.status === 'Ongoing' ? 'rgba(6,182,212,0.35)' : 'rgba(124,58,237,0.35)'}`,
                      color: animeInfo.status === 'Ongoing' ? '#06B6D4' : '#A78BFA',
                    }}
                  >
                    {animeInfo.status}
                  </span>
                )}

                {animeInfo?.score && (
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#F59E0B' }}>
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {animeInfo.score}
                  </span>
                )}

                <span className="flex items-center gap-1 text-xs" style={{ color: '#7B6EA8' }}>
                  <Eye className="w-3.5 h-3.5" />
                  2.4M views
                </span>

                {/* Stream type badge */}
                <span
                  className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#06B6D4' }}
                >
                  <Server className="w-3 h-3" />
                  {streamBadge}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                {animeTitle}
                {currentEpisode && (
                  <span className="text-xl font-semibold ml-3" style={{ color: '#7B6EA8' }}>
                    — Ep. {currentEpisode.episodeNumber}
                  </span>
                )}
              </h1>

              {/* Synopsis */}
              {loading ? (
                <div className="space-y-2 mb-5">
                  <div className="skeleton h-3.5 rounded" style={{ width: '100%' }} />
                  <div className="skeleton h-3.5 rounded" style={{ width: '92%' }} />
                  <div className="skeleton h-3.5 rounded" style={{ width: '78%' }} />
                </div>
              ) : animeError ? (
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#EF4444' }}>
                  Unable to load anime information.
                </p>
              ) : (
                <p className="text-sm leading-relaxed mb-5 line-clamp-3" style={{ color: '#A1A1AA' }}>
                  {synopsis}
                </p>
              )}

              {/* Footer metadata */}
              <div
                className="flex flex-wrap items-center gap-5 pt-4 text-xs"
                style={{ borderTop: '1px solid rgba(124,58,237,0.1)', color: '#7B6EA8' }}
              >
                {animeInfo?.releaseYear && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                    <span>{animeInfo.releaseYear}</span>
                  </div>
                )}
                {animeInfo?.totalEpisodes && (
                  <div className="flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                    <span>{animeInfo.totalEpisodes} Episodes</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
                  <span>~24 min / episode</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#C026D3' }} />
                  <span>1080p Full HD</span>
                </div>

                {/* Watchlist button */}
                <button
                  className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    color: '#C4B5FD',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.12)'}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  Add to Library
                </button>
              </div>
            </div>

            {/* ── Genres row ────────────────────────────────────────────────── */}
            {!loading && animeInfo?.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {animeInfo.genres.map((g, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      color: '#A78BFA',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Episode List ───────────────────────────────────── */}
          <div
            className="rounded-3xl flex flex-col"
            style={{
              background: 'rgba(26,16,48,0.75)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,58,237,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxHeight: 'calc(100vh - 180px)',
              position: 'sticky',
              top: '90px',
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  <Film className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                </div>
                <h2 className="text-sm font-bold text-white">Episode List</h2>
              </div>
              <span
                className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}
              >
                {episodes.length} eps
              </span>
            </div>

            {/* Scrollable episode list */}
            <div
              className="flex flex-col gap-2 p-3 overflow-y-auto af-scrollbar"
              style={{ flex: 1, minHeight: 0 }}
            >
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <EpisodeSkeleton key={i} />)
              ) : episodesError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-sm" style={{ color: '#A1A1AA' }}>
                  <AlertTriangle className="w-8 h-8 mb-2" style={{ color: '#EF4444' }} />
                  <p>Unable to load episode list.</p>
                </div>
              ) : episodes.length > 0 ? (
                episodes.map(ep => (
                  <EpisodeItem key={ep._id} ep={ep} activeId={episodeId} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-sm" style={{ color: '#A1A1AA' }}>
                  <AlertTriangle className="w-8 h-8 mb-2" style={{ color: '#EF4444' }} />
                  <p>No episodes found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
