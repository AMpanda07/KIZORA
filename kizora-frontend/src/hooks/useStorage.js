import { useState, useEffect } from 'react';

const WATCHLIST_KEY = 'kizora_watchlist';
const HISTORY_KEY = 'kizora_watch_history';
const FAVORITES_KEY = 'kizora_favorites';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, [watchlist]);

  const addToWatchlist = (anime) => {
    if (!anime) return;
    const animeId = String(anime._id || anime.malId || anime.id);
    setWatchlist((prev) => {
      if (prev.some((item) => String(item._id || item.malId || item.id) === animeId)) {
        return prev;
      }
      return [
        {
          _id: animeId,
          malId: anime.malId || animeId,
          title: anime.title || 'Untitled',
          coverImage: anime.coverImage || anime.poster || '',
          score: anime.score,
          status: anime.status,
          totalEpisodes: anime.totalEpisodes || anime.episodes,
          addedAt: Date.now(),
        },
        ...prev,
      ];
    });
  };

  const removeFromWatchlist = (animeId) => {
    const idStr = String(animeId);
    setWatchlist((prev) => prev.filter((item) => String(item._id || item.malId || item.id) !== idStr));
  };

  const isInWatchlist = (animeId) => {
    const idStr = String(animeId);
    return watchlist.some((item) => String(item._id || item.malId || item.id) === idStr);
  };

  const toggleWatchlist = (anime) => {
    const animeId = String(anime._id || anime.malId || anime.id);
    if (isInWatchlist(animeId)) {
      removeFromWatchlist(animeId);
      return false;
    } else {
      addToWatchlist(anime);
      return true;
    }
  };

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist };
}

export function useWatchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save watch history to localStorage', e);
    }
  }, [history]);

  const updateProgress = ({
    animeId,
    episodeNumber,
    episodeId,
    animeTitle,
    episodeTitle,
    poster,
    currentTime = 0,
    duration = 0,
  }) => {
    if (!animeId) return;
    const idStr = String(animeId);
    const progressPercent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

    setHistory((prev) => {
      const filtered = prev.filter((item) => String(item.animeId) !== idStr);
      const updatedItem = {
        animeId: idStr,
        episodeNumber: episodeNumber || 1,
        episodeId: episodeId || `${idStr}-ep-${episodeNumber || 1}`,
        animeTitle: animeTitle || 'Anime',
        episodeTitle: episodeTitle || `Episode ${episodeNumber || 1}`,
        poster: poster || '',
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        progress: progressPercent,
        updatedAt: Date.now(),
      };
      return [updatedItem, ...filtered].slice(0, 30); // keep up to 30 recent items
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const removeFromHistory = (animeId) => {
    const idStr = String(animeId);
    setHistory((prev) => prev.filter((item) => String(item.animeId) !== idStr));
  };

  return { history, updateProgress, clearHistory, removeFromHistory };
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('kizora_settings');
      return saved
        ? JSON.parse(saved)
        : {
            theme: 'dark',
            autoplayNext: true,
            autoPlay: true,
            defaultQuality: 'auto',
            compactCards: false,
            reduceAnimations: false,
          };
    } catch {
      return {
        theme: 'dark',
        autoplayNext: true,
        autoPlay: true,
        defaultQuality: 'auto',
        compactCards: false,
        reduceAnimations: false,
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kizora_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}
