import React, { useState } from 'react';
import { useWatchlist, useWatchHistory } from '../hooks/useStorage';
import { AnimeCard } from '../components/domain/AnimeCard';
import { WatchlistTabs } from '../components/domain/WatchlistTabs';
import { EmptyState } from '../components/common/EmptyState';

const STATUSES = ['All', 'Watching', 'Plan to Watch', 'Completed', 'Dropped'];

export const Watchlist = () => {
  const { watchlist } = useWatchlist();
  const { history } = useWatchHistory();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const loading = false;

  // Map the local storage watchlist to the format expected by the new UI
  const mappedWatchlist = watchlist.map(anime => {
    // Find history entry for progress
    const historyItem = history.find(h => h.animeId === String(anime._id || anime.id));
    // Determine local status (Watchlist vs History overlap)
    const localStatus = historyItem ? (historyItem.progress >= 95 ? 'Completed' : 'Watching') : 'Plan to Watch';
    return {
      anime: {
        ...anime,
        id: anime._id || anime.id,
        episodes: anime.totalEpisodes || anime.episodes
      },
      status: localStatus,
      progress: historyItem ? historyItem.episodeNumber : 0
    };
  });

  const filteredWatchlist = selectedStatus === 'All' 
    ? mappedWatchlist 
    : mappedWatchlist.filter(item => item.status === selectedStatus);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
      
      <WatchlistTabs 
        statuses={STATUSES} 
        selectedStatus={selectedStatus} 
        onSelectStatus={setSelectedStatus} 
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={48} /></div>
      ) : filteredWatchlist.length === 0 ? (
        <EmptyState 
          title="Your watchlist is empty" 
          description={selectedStatus === 'All' ? "Start adding shows you want to watch!" : `You don't have any anime in '${selectedStatus}'.`}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredWatchlist.map(item => (
            <div key={item.anime.id} className="relative group">
              <AnimeCard anime={item.anime} />
              <div className="absolute top-2 left-2 bg-kz-primary px-2 py-1 rounded text-xs font-bold text-white z-10">
                {item.status}
              </div>
              <div className="w-full h-1 bg-kz-surface mt-1 rounded overflow-hidden">
                <div 
                  className="h-full bg-kz-primary" 
                  style={{ width: `${(item.progress / (item.anime.episodes || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-kz-muted text-right mt-1">
                {item.progress} / {item.anime.episodes || '?'} ep
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
