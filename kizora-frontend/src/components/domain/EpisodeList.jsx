import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export const EpisodeList = ({ episodes, animeId }) => {
  if (!episodes || episodes.length === 0) {
    return <div className="text-kz-muted py-4">No episodes available.</div>;
  }

  return (
    <div className="space-y-2">
      {episodes.map((ep, idx) => {
        const epNum = ep.episodeNumber || ep.number || idx + 1;
        const key = ep._id || ep.id || ep.providerEpisodeId || `ep-${epNum}-${idx}`;
        return (
          <Link 
            key={key}
            to={`/watch/${animeId}/${epNum}`}
            className="flex items-center justify-between p-3 bg-kz-surface rounded hover:bg-kz-card transition-colors border border-transparent hover:border-kz-primary group"
          >
            <div className="flex items-center space-x-4">
              <span className="text-kz-muted w-6 text-center font-medium">{epNum}</span>
              <div className="font-medium group-hover:text-kz-primary transition-colors">{ep.title || `Episode ${epNum}`}</div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-kz-muted">{ep.duration}</span>
              <Play size={18} className="text-kz-muted group-hover:text-kz-primary transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};
