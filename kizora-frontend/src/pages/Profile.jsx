import React, { useEffect, useState } from 'react';
import { animeService } from '../services/animeService';
import { Settings, Clock, MonitorPlay } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useWatchHistory } from '../hooks/useStorage';

export const Profile = () => {

  const { history } = useWatchHistory();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate a local mock profile from history stats
    const totalEpisodesWatched = history.length;
    const daysWatched = ((totalEpisodesWatched * 24) / (60 * 24)).toFixed(1);
    
    setProfile({
      name: 'KIZORA Viewer',
      avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80',
      joined: 'Today',
      stats: {
        episodesWatched: totalEpisodesWatched,
        daysWatched: daysWatched
      }
    });
    setLoading(false);
  }, [history]);

  // No error handling needed for local mock
  // if (error) return <ErrorState message={error} />;
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-48 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-32 w-1/3" />
          <Skeleton className="h-32 w-1/3" />
          <Skeleton className="h-32 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-kz-surface rounded-lg p-8 flex flex-col md:flex-row items-center border border-kz-border">
        <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-full mb-4 md:mb-0 md:mr-8 border-4 border-kz-primary" />
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-kz-muted mb-4">Joined {profile.joined}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline"><Settings size={18} className="mr-2" /> Edit Profile</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-kz-surface p-6 rounded border border-kz-border flex items-center space-x-4">
          <div className="p-4 bg-kz-primary/10 rounded-full text-kz-primary">
            <MonitorPlay size={32} />
          </div>
          <div>
            <p className="text-kz-muted text-sm uppercase tracking-wide">Episodes Watched</p>
            <p className="text-3xl font-bold">{profile.stats.episodesWatched}</p>
          </div>
        </div>
        <div className="bg-kz-surface p-6 rounded border border-kz-border flex items-center space-x-4">
          <div className="p-4 bg-kz-secondary/10 rounded-full text-kz-secondary">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-kz-muted text-sm uppercase tracking-wide">Days Watched</p>
            <p className="text-3xl font-bold">{profile.stats.daysWatched}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
