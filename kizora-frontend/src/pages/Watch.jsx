import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import { Play, Star, Eye, Calendar, Sparkles, Film, Loader2 } from 'lucide-react';

const fallbackEpisodeData = {
  _id: 'ep-1090',
  episodeNumber: 1090,
  title: 'Wano Country Arc - The Final Showdown! Luffy vs Kaido',
  synopsis: 'As the battle above Onigashima reaches its climax, Luffy channels the ancient power of Gear 5 to challenge Kaido in a battle that will reshape the fate of Wano Country forever.',
  releaseDate: '2024-01-21',
  views: '2.4M',
  rating: '4.95',
  animeId: {
    _id: 'anime-1',
    title: 'One Piece'
  },
  thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop'
};

const fallbackUpNextEpisodes = [
  {
    _id: 'ep-1091',
    episodeNumber: 1091,
    title: 'The Future Island! Adventure in Egghead',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    duration: '24:00'
  },
  {
    _id: 'ep-1092',
    episodeNumber: 1092,
    title: 'Dr. Vegapunk’s Secret Laboratory',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    duration: '23:45'
  },
  {
    _id: 'ep-1093',
    episodeNumber: 1093,
    title: 'Seraphim Threat! Emergency Defense',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    duration: '24:15'
  }
];

const Watch = () => {
  const { episodeId } = useParams();
  const [episode, setEpisode] = useState(fallbackEpisodeData);
  const [upNextEpisodes, setUpNextEpisodes] = useState(fallbackUpNextEpisodes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodeDetails = async () => {
      if (!episodeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const epResponse = await API.get(`/anime/episode-detail/${episodeId}`);
        if (epResponse.data) {
          setEpisode(epResponse.data);

          // Fetch Up Next episodes if animeId is present
          if (epResponse.data.animeId && epResponse.data.animeId._id) {
            const nextRes = await API.get(`/anime/${epResponse.data.animeId._id}/episodes`);
            if (nextRes.data && nextRes.data.length > 0) {
              setUpNextEpisodes(nextRes.data);
            }
          }
        }
      } catch (err) {
        console.warn('API error, using fallback episode details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodeDetails();
  }, [episodeId]);

  // Construct dynamic stream URL
  const videoStreamUrl = `http://localhost:5000/api/stream/video/${episodeId || '65b2f1a9e8d4a9b2c3d4e5f6'}`;

  const animeTitle = episode.animeId?.title || 'One Piece';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Floating Glassmorphic Loading Spinner */}
      {loading && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading Stream & Metadata...</span>
        </div>
      )}

      {/* Video Player Container */}
      <div className="w-full mb-8">
        <VideoPlayer
          src={videoStreamUrl}
          poster={episode.thumbnail || fallbackEpisodeData.thumbnail}
          title={episode.title}
        />
      </div>

      {/* Episode Header & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                Episode {episode.episodeNumber || 1}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {animeTitle}
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
              {episode.synopsis || fallbackEpisodeData.synopsis}
            </p>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Air Date: {episode.releaseDate || '2024-01-21'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>1080p Ultra HD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Up Next Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Up Next</span>
            </h2>
            <span className="text-xs text-zinc-400">Auto-play ON</span>
          </div>

          <div className="flex flex-col gap-3">
            {upNextEpisodes.map((ep) => (
              <Link
                key={ep._id}
                to={`/watch/${ep._id}`}
                className="group p-3 rounded-2xl bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-300 flex gap-4"
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
