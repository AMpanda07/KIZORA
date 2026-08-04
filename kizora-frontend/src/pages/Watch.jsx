import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Star, Eye, Calendar, Sparkles, Film, Loader2, Server } from 'lucide-react';

const fallbackEpisodeData = {
  _id: 'ep-1',
  episodeNumber: 1,
  title: 'Wano Country Arc - The Final Showdown! Luffy vs Kaido',
  synopsis: 'As the battle above Onigashima reaches its climax, Luffy channels the ancient power of Gear 5 to challenge Kaido in a battle that will reshape the fate of Wano Country forever.',
  releaseDate: '2024-01-21',
  views: '2.4M',
  rating: '4.95',
  animeTitle: 'One Piece',
  thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
};

const Watch = () => {
  const { episodeId } = useParams();
  const [episode, setEpisode] = useState(fallbackEpisodeData);
  const [streamSources, setStreamSources] = useState([]);
  const [servers, setServers] = useState([]);
  const [upNextEpisodes, setUpNextEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchData = async () => {
      const epId = episodeId || '1';
      try {
        setLoading(true);

        // 1. Fetch HLS Stream links & servers from provider API
        const streamRes = await API.get(`/provider/stream/${epId}`);
        if (streamRes.data && streamRes.data.sources) {
          setStreamSources(streamRes.data.sources);
          setServers(streamRes.data.servers || []);
        }

        // 2. Fetch episode metadata if numerical or ID
        const targetAnimeId = epId.includes('-') ? epId.split('-')[0] : '1';
        const [epRes, animeRes] = await Promise.allSettled([
          API.get(`/provider/episodes/${targetAnimeId}`),
          API.get(`/provider/info/${targetAnimeId}`)
        ]);

        if (epRes.status === 'fulfilled' && epRes.value.data.length > 0) {
          setUpNextEpisodes(epRes.value.data);
          const matched = epRes.value.data.find(e => e._id === epId) || epRes.value.data[0];
          if (matched) {
            setEpisode(prev => ({ ...prev, ...matched }));
          }
        }

        if (animeRes.status === 'fulfilled' && animeRes.value.data) {
          setEpisode(prev => ({
            ...prev,
            animeTitle: animeRes.value.data.title,
            synopsis: animeRes.value.data.synopsis || prev.synopsis,
            rating: animeRes.value.data.score ? animeRes.value.data.score.toString() : prev.rating
          }));
        }
      } catch (err) {
        console.warn('Watch API fetch error, using fallback HLS data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [episodeId]);

  const defaultStreamUrl = streamSources.length > 0
    ? streamSources[0].url
    : 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Floating Glassmorphic Sync Indicator */}
      {loading && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Fetching HLS Stream & Servers...</span>
        </div>
      )}

      {/* Video Player Container */}
      <div className="w-full mb-8">
        <VideoPlayer
          src={defaultStreamUrl}
          sources={streamSources}
          servers={servers}
          poster={episode.thumbnail || fallbackEpisodeData.thumbnail}
          title={episode.title}
        />
      </div>

      {/* Episode Header & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                Episode {episode.episodeNumber || 1}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {episode.animeTitle || 'One Piece'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {episode.rating || '4.95'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Eye className="w-3.5 h-3.5" />
                {episode.views || '2.4M'} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
              {episode.title}
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
              {episode.synopsis}
            </p>

            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Air Date: {episode.releaseDate || '2024'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Adaptive HLS Stream (.m3u8)</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>1080p Full HD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Up Next Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Up Next Episodes</span>
            </h2>
            <span className="text-xs text-zinc-400">Auto-play ON</span>
          </div>

          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {upNextEpisodes.map((ep) => (
              <Link
                key={ep._id}
                to={`/watch/${ep._id}`}
                className={`group p-3 rounded-2xl border backdrop-blur-md transition-all duration-300 flex gap-4 ${
                  ep._id === episodeId
                    ? 'bg-cyan-500/20 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                    : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-white/5 hover:border-cyan-400/40'
                }`}
              >
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0">
                  <img
                    src={ep.thumbnail || fallbackEpisodeData.thumbnail}
                    alt={ep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Play className="w-5 h-5 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/80 text-zinc-300 font-mono">
                    {ep.duration || '24:00'}
                  </span>
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-cyan-400">
                    Episode {ep.episodeNumber}
                  </span>
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 transition-colors line-clamp-2 mt-0.5">
                    {ep.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
