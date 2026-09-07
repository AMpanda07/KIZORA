const WATCHLIST_KEY = 'kizora_watchlist';

const getWatchlistFromStorage = () => {
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse watchlist from local storage", e);
    return [];
  }
};

const saveWatchlistToStorage = (watchlist) => {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
};

export const watchlistService = {
  getWatchlist() {
    return Promise.resolve(getWatchlistFromStorage());
  },

  addToWatchlist(anime, status = 'Plan to Watch') {
    const watchlist = getWatchlistFromStorage();
    if (!watchlist.find(item => item.anime.id === anime.id)) {
      watchlist.push({
        anime,
        status, // 'Watching', 'Completed', 'Plan to Watch', 'Dropped'
        progress: 0,
        addedAt: new Date().toISOString()
      });
      saveWatchlistToStorage(watchlist);
    }
    return Promise.resolve(watchlist);
  },

  updateProgress(animeId, progress) {
    const watchlist = getWatchlistFromStorage();
    const item = watchlist.find(i => i.anime.id === animeId);
    if (item) {
      item.progress = progress;
      if (item.progress === item.anime.episodes) {
        item.status = 'Completed';
      } else if (item.progress > 0 && item.status === 'Plan to Watch') {
        item.status = 'Watching';
      }
      saveWatchlistToStorage(watchlist);
    }
    return Promise.resolve(watchlist);
  },

  removeFromWatchlist(animeId) {
    let watchlist = getWatchlistFromStorage();
    watchlist = watchlist.filter(item => item.anime.id !== animeId);
    saveWatchlistToStorage(watchlist);
    return Promise.resolve(watchlist);
  },

  isInWatchlist(animeId) {
    const watchlist = getWatchlistFromStorage();
    return Promise.resolve(!!watchlist.find(item => item.anime.id === animeId));
  }
};
