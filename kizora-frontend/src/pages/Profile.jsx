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
            <p className="text-kz-muted text-sm uppercase tracking-wide">Time Spent</p>
            <p className="text-3xl font-bold">{profile.stats.daysWatched} days</p>
          </div>
        </div>
      </div>

      {/* Recently Watched History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-kz-primary" /> Recently Watched
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="bg-kz-surface p-6 rounded border border-kz-border text-center text-kz-muted">
            No watch history yet. Start watching anime to track your progress!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {history.map((item) => (
              <a
                key={item.animeId}
                href={`/watch/${item.animeId}/${item.episodeNumber}`}
                className="bg-kz-surface p-3 rounded border border-kz-border hover:border-kz-primary transition-colors flex gap-3 group"
              >
                <img
                  src={item.poster}
                  alt={item.animeTitle}
                  className="w-16 h-22 object-cover rounded flex-shrink-0 bg-kz-bg"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-kz-text truncate group-hover:text-kz-primary">
                      {item.animeTitle}
                    </h4>
                    <p className="text-xs text-kz-muted mt-1">
                      Episode {item.episodeNumber}
                    </p>
                  </div>

                  <div className="space-y-1 mt-2">
                    <div className="w-full h-1.5 bg-kz-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-kz-primary rounded-full"
                        style={{ width: `${item.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-kz-muted text-right">
                      {item.progress || 0}% completed
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
