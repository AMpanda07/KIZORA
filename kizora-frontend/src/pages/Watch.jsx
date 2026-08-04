import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAnimeInfo, fetchEpisodes, fetchStreamSources } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Star, Eye, Calendar, Sparkles, Film, Loader2, Server, ArrowLeft } from 'lucide-react';

// ─── Fallback episode data (shown while loading or on error) ─────────────────
const FALLBACK_EPISODE = {
  _id: 'ep-1',
  episodeNumber: 1,
  title: 'The Great Adventure Begins',
  synopsis: 'Our hero sets out on an epic journey that will change the fate of the world. Armed with courage and determination, the first steps of a legendary adventure are taken.',
  releaseDate: '2024-01-21',
  views: '2.4M',
  rating: '8.7',
  animeTitle: 'KIZORA Anime',
  thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
};

// ─── Fallback test stream ─────────────────────────────────────────────────────
const FALLBACK_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();

  const [episode, setEpisode] = useState(FALLBACK_EPISODE);
  const [streamSources, setStreamSources] = useState([]);
  const [servers, setServers] = useState([]);
  const [upNextEpisodes, setUpNextEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchWatchData = async () => {
      const epId = episodeId || '21';
      try {
        setLoading(true);

        // Determine if this is a compound ID like "21-ep-1" or just an anime/episode ID
        const parts = epId.split('-ep-');
        const animeId = parts[0];

        // Parallel fetch: stream sources + anime info + episode list
        const [streamResult, animeResult, episodesResult] = await Promise.allSettled([
          fetchStreamSources(epId),
          fetchAnimeInfo(animeId),
          fetchEpisodes(animeId)
        ]);

        if (!mounted) return;

        // Stream sources
        if (streamResult.status === 'fulfilled' && streamResult.value?.sources) {
          setStreamSources(streamResult.value.sources);
          setServers(streamResult.value.servers || []);
        }

        // Anime metadata
        if (animeResult.status === 'fulfilled' && animeResult.value) {
          const info = animeResult.value;
          setEpisode(prev => ({
            ...prev,
            animeTitle: info.title || prev.animeTitle,
            synopsis: info.synopsis || prev.synopsis,
            rating: info.score ? info.score.toString() : prev.rating,
            thumbnail: info.coverImage || prev.thumbnail
          }));
        }

        // Episode list for sidebar
        if (episodesResult.status === 'fulfilled' && episodesResult.value?.length > 0) {
          setUpNextEpisodes(episodesResult.value);
          // Find the matching episode or use first
          const matched = episodesResult.value.find(e => e._id === epId) || episodesResult.value[0];
          if (matched) {
            setEpisode(prev => ({
              ...prev,
              episodeNumber: matched.episodeNumber || prev.episodeNumber,
              title: matched.title || prev.title,
              thumbnail: matched.thumbnail || prev.thumbnail
            }));
          }
        }
      } catch (err) {
        console.warn('[Watch] Fetch error, using fallback data:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWatchData();
    return () => { mounted = false; };
  }, [episodeId]);

  const defaultStreamUrl = streamSources.length > 0
    ? streamSources[0].url
    : FALLBACK_STREAM;

  return (
    <div className="min-h-screen text-white pt-24 pb-20" style={{ background: '#0B0C10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: '#a1a1aa' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8B5CF6'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-sm font-medium" style={{ color: '#a1a1aa' }}>
            {episode.animeTitle}
          </span>
        </div>

        {/* ── HLS Sync Indicator ───────────────────────────────────────────── */}
        {loading && (
          <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(34,211,238,0.3)', color: '#67e8f9', boxShadow: '0 0 20px rgba(34,211,238,0.25)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching HLS Stream...
          </div>
        )}

        {/* ── VIDEO PLAYER ─────────────────────────────────────────────────── */}
        <div className="w-full mb-8">
          <VideoPlayer
            src={defaultStreamUrl}
            sources={streamSources}
            servers={servers}
            poster={episode.thumbnail || FALLBACK_EPISODE.thumbnail}
            title={episode.title}
          />
        </div>

        {/* ── EPISODE INFO + SIDEBAR GRID ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main episode details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

              {/* Episode badge row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#67e8f9' }}>
                  Episode {episode.episodeNumber || 1}
                </span>
                <span className="text-xs font-semibold" style={{ color: '#a1a1aa' }}>
                  {episode.animeTitle}
                </span>
                <span style={{ color: '#52525b' }}>•</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#fbbf24' }}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {episode.rating || '8.7'}
                </span>
                <span style={{ color: '#52525b' }}>•</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: '#a1a1aa' }}>
                  <Eye className="w-3.5 h-3.5" />
                  {episode.views || '2.4M'} views
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
                {episode.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: '#a1a1aa' }}>
                {episode.synopsis}
              </p>

              {/* Footer metadata */}
              <div className="pt-4 flex flex-wrap items-center justify-between text-xs gap-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#71717a' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: '#22d3ee' }} />
                  <span>Air Date: {episode.releaseDate || '2024'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" style={{ color: '#22d3ee' }} />
                  <span>Adaptive HLS Stream (.m3u8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
                  <span>1080p Full HD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Episode playlist sidebar */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1 mb-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4" style={{ color: '#22d3ee' }} />
                Up Next
              </h2>
              <span className="text-xs" style={{ color: '#52525b' }}>Auto-play ON</span>
            </div>

            <div className="flex flex-col gap-3" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
              {upNextEpisodes.length > 0 ? upNextEpisodes.map((ep) => (
                <Link
                  key={ep._id}
                  to={`/watch/${ep._id}`}
                  className="group flex gap-3 p-3 rounded-2xl transition-all duration-300"
                  style={{
                    background: ep._id === episodeId ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${ep._id === episodeId ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 overflow-hidden rounded-xl" style={{ width: '108px', aspectRatio: '16/9', background: '#09090b' }}>
                    <img
                      src={ep.thumbnail || FALLBACK_EPISODE.thumbnail}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      style={{ transition: 'transform 0.3s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <Play className="w-5 h-5" style={{ color: '#67e8f9' }} />
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                      style={{ background: 'rgba(0,0,0,0.8)', color: '#d4d4d8' }}>
                      {ep.duration || '24:00'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <span className="text-[11px] font-bold mb-0.5" style={{ color: '#22d3ee' }}>
                      Episode {ep.episodeNumber}
                    </span>
                    <h4 className="text-xs font-semibold line-clamp-2 transition-colors"
                      style={{ color: ep._id === episodeId ? '#67e8f9' : '#d4d4d8' }}>
                      {ep.title}
                    </h4>
                  </div>
                </Link>
              )) : (
                // Fallback episode list when API is unavailable
                Array.from({ length: 6 }, (_, i) => (
                  <Link
                    key={i}
                    to={`/watch/${episodeId?.split('-ep-')[0] || '21'}-ep-${i + 1}`}
                    className="group flex gap-3 p-3 rounded-2xl transition-all duration-300"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="relative flex-shrink-0 overflow-hidden rounded-xl" style={{ width: '108px', aspectRatio: '16/9', background: '#141414' }}>
                      <img src={FALLBACK_EPISODE.thumbnail} alt={`Episode ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[11px] font-bold mb-0.5" style={{ color: '#22d3ee' }}>Episode {i + 1}</span>
                      <span className="text-xs" style={{ color: '#a1a1aa' }}>Chapter {i + 1}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
