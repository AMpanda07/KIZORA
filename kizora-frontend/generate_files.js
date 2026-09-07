const fs = require('fs');
const path = require('path');

const files = {
  // Common Components
  'src/components/common/Skeleton.jsx': `
import React from 'react';
export default function Skeleton({ className = '' }) {
  return <div className={\`animate-pulse bg-kz-border rounded \${className}\`} />;
}
`,
  'src/components/common/Spinner.jsx': `
import React from 'react';
import { Loader2 } from 'lucide-react';
export default function Spinner({ className = 'h-8 w-8', fullScreen = false }) {
  const loader = <Loader2 className={\`animate-spin text-kz-accent \${className}\`} />;
  if (fullScreen) {
    return <div className="flex h-full w-full min-h-[50vh] items-center justify-center">{loader}</div>;
  }
  return loader;
}
`,
  'src/components/common/ErrorState.jsx': `
import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';
export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-kz-text-secondary text-center p-6">
      <AlertCircle className="h-12 w-12 text-kz-danger mb-4" />
      <h3 className="text-lg font-medium text-kz-text-primary mb-2">Error</h3>
      <p className="mb-4">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try Again</Button>}
    </div>
  );
}
`,
  'src/components/common/EmptyState.jsx': `
import React from 'react';
import { Ghost } from 'lucide-react';
export default function EmptyState({ message = 'Nothing to see here', icon: Icon = Ghost }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-kz-text-muted text-center p-6">
      <Icon className="h-16 w-16 mb-4 opacity-50" />
      <p className="text-lg">{message}</p>
    </div>
  );
}
`,

  // Layout Components
  'src/components/layout/AppLayout.jsx': `
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-kz-bg text-kz-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth hide-scrollbar">
          <div className="max-w-7xl mx-auto pb-24 md:pb-0">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
`,
  'src/components/layout/Sidebar.jsx': `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingUp, Calendar, Bookmark, Search, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { path: '/profile', label: 'Profile', icon: User }
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-kz-bg-secondary border-r border-kz-border h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-kz-accent tracking-wider">KIZORA</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              \`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors \${
                isActive 
                  ? 'bg-kz-accent text-white' 
                  : 'text-kz-text-secondary hover:bg-kz-card-hover hover:text-kz-text-primary'
              }\`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
`,
  'src/components/layout/TopNav.jsx': `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function TopNav() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(\`/search?q=\${encodeURIComponent(query.trim())}\`);
    }
  };

  return (
    <header className="h-16 flex items-center px-4 md:px-8 bg-kz-bg-secondary/80 backdrop-blur-md sticky top-0 z-40 border-b border-kz-border">
      <div className="md:hidden flex items-center mr-4">
        <h1 className="text-xl font-bold text-kz-accent">KIZORA</h1>
      </div>
      <div className="flex-1 flex justify-end">
        <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-kz-text-muted" />
          <input
            type="text"
            placeholder="Search anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-kz-card border border-kz-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-kz-accent text-kz-text-primary placeholder:text-kz-text-muted transition-colors"
          />
        </form>
      </div>
    </header>
  );
}
`,
  'src/components/layout/MobileNav.jsx': `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Bookmark, Search, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { path: '/profile', label: 'Profile', icon: User }
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-kz-bg-secondary border-t border-kz-border px-6 py-3 flex justify-between items-center z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            \`flex flex-col items-center gap-1 \${
              isActive ? 'text-kz-accent' : 'text-kz-text-muted'
            }\`
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
`,

  // Anime Components
  'src/components/anime/AnimeCard.jsx': `
import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function AnimeCard({ anime, rank }) {
  return (
    <Link to={\`/anime/\${anime.id}\`} className="group relative rounded-xl overflow-hidden bg-kz-card block aspect-[2/3] shrink-0">
      <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="bg-kz-accent rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Play className="h-6 w-6 text-white fill-current ml-1" />
        </div>
      </div>
      {rank && (
        <div className="absolute top-2 left-2 bg-kz-accent text-white font-bold text-xs px-2 py-1 rounded">
          #{rank}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <h3 className="text-white font-medium text-sm truncate">{anime.title}</h3>
        <p className="text-kz-text-muted text-xs">{anime.year} • {anime.status}</p>
      </div>
    </Link>
  );
}
`,
  'src/components/anime/HorizontalAnimeCard.jsx': `
import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function HorizontalAnimeCard({ anime }) {
  return (
    <Link to={\`/anime/\${anime.id}\`} className="group flex gap-4 bg-kz-card hover:bg-kz-card-hover rounded-xl p-3 transition-colors shrink-0 md:w-[350px] w-[300px]">
      <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden relative">
        <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Play className="h-5 w-5 text-white fill-current" />
        </div>
      </div>
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <h4 className="font-medium text-kz-text-primary truncate mb-1">{anime.title}</h4>
        <p className="text-xs text-kz-text-secondary truncate mb-2">{anime.status}</p>
        <div className="flex gap-2">
          {anime.genres.slice(0,2).map(g => (
            <span key={g} className="text-[10px] px-2 py-1 rounded-full bg-kz-bg text-kz-text-muted">
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
`,
  
  // Pages
  'src/pages/Home.jsx': `
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import AnimeCard from '../components/anime/AnimeCard';
import HorizontalAnimeCard from '../components/anime/HorizontalAnimeCard';
import Spinner from '../components/common/Spinner';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [topAiring, setTopAiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      animeService.getTrending(),
      animeService.getTopAiring()
    ]).then(([trendData, airData]) => {
      setTrending(trendData);
      setTopAiring(airData);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner fullScreen />;

  const heroAnime = trending[0];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      {heroAnime && (
        <div className="relative rounded-2xl overflow-hidden h-[400px] md:h-[500px] flex items-end">
          <img src={heroAnime.coverImage} alt={heroAnime.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 md:bg-gradient-to-r md:from-black/90 md:to-transparent" />
          <div className="relative z-10 p-6 md:p-12 w-full md:w-2/3">
            <span className="inline-block px-3 py-1 bg-kz-accent text-white text-xs font-bold rounded-full mb-4">#1 TRENDING</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 line-clamp-2">{heroAnime.title}</h2>
            <p className="text-kz-text-secondary text-sm md:text-base line-clamp-3 mb-6 max-w-2xl">{heroAnime.description}</p>
            <div className="flex gap-4">
              <Link to={\`/anime/\${heroAnime.id}\`} className="bg-kz-accent hover:bg-kz-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Watch Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-white">Trending Now</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {trending.map((anime, i) => (
            <div key={anime.id} className="w-32 md:w-48 shrink-0 snap-start">
              <AnimeCard anime={anime} rank={i + 1} />
            </div>
          ))}
        </div>
      </section>

      {/* Top Airing Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-white">Top Airing</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {topAiring.map((anime) => (
            <HorizontalAnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
`,

  'src/pages/AnimeDetails.jsx': `
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { watchlistService } from '../services/watchlistService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import { Play, Plus, Check } from 'lucide-react';

export default function AnimeDetails() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setLoading(true);
    setInWatchlist(watchlistService.isInWatchlist(id));
    Promise.all([
      animeService.getAnime(id),
      animeService.getEpisodes(id)
    ]).then(([animeData, episodesData]) => {
      setAnime(animeData);
      setEpisodes(episodesData);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      watchlistService.removeFromWatchlist(id);
    } else {
      watchlistService.addToWatchlist(anime);
    }
    setInWatchlist(!inWatchlist);
  };

  if (loading) return <Spinner fullScreen />;
  if (error || !anime) return <ErrorState message={error} />;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <img src={anime.poster} alt={anime.title} className="w-full rounded-xl shadow-lg" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{anime.title}</h1>
          <h2 className="text-lg text-kz-text-secondary mb-4">{anime.alternativeTitle}</h2>
          
          <div className="flex flex-wrap gap-4 text-sm text-kz-text-muted mb-6">
            <span>{anime.year}</span>
            <span>•</span>
            <span>{anime.status}</span>
            <span>•</span>
            <span className="text-kz-accent">{anime.rating} / 10</span>
            <span>•</span>
            <span>{anime.studio}</span>
          </div>

          <div className="flex gap-2 mb-6">
            {anime.genres.map(g => (
              <span key={g} className="px-3 py-1 bg-kz-card border border-kz-border rounded-full text-xs text-kz-text-secondary">{g}</span>
            ))}
          </div>

          <p className="text-kz-text-secondary leading-relaxed mb-8">{anime.description}</p>

          <div className="flex gap-4">
            <Link to={\`/watch/\${anime.id}/\${episodes[0]?.id || '1'}\`}>
              <Button size="lg" className="gap-2">
                <Play className="w-5 h-5 fill-current" /> Watch Now
              </Button>
            </Link>
            <Button size="lg" variant={inWatchlist ? "secondary" : "secondary"} onClick={toggleWatchlist} className="gap-2">
              {inWatchlist ? <Check className="w-5 h-5 text-kz-success" /> : <Plus className="w-5 h-5" />}
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </Button>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Episodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {episodes.map(ep => (
            <Link key={ep.id} to={\`/watch/\${anime.id}/\${ep.id}\`} className="flex gap-4 bg-kz-card hover:bg-kz-card-hover border border-kz-border rounded-xl p-3 transition-colors">
              <div className="w-24 h-16 rounded overflow-hidden relative shrink-0">
                <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-[10px] rounded text-white">{ep.duration}</div>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-xs text-kz-accent font-medium mb-1">Episode {ep.number}</span>
                <span className="text-sm text-kz-text-primary truncate">{ep.title}</span>
              </div>
            </Link>
          ))}
          {episodes.length === 0 && (
             <p className="text-kz-text-muted">No episodes available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
`,

  'src/pages/Watch.jsx': `
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      animeService.getAnime(animeId),
      animeService.getEpisodes(animeId)
    ]).then(([animeData, episodesData]) => {
      setAnime(animeData);
      setEpisodes(episodesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [animeId]);

  if (loading) return <Spinner fullScreen />;
  if (!anime) return <ErrorState />;

  const currentEpIndex = episodes.findIndex(e => e.id === episodeId) || 0;
  const currentEp = episodes[currentEpIndex] || episodes[0];
  
  const handlePrev = () => {
    if (currentEpIndex > 0) {
      navigate(\`/watch/\${animeId}/\${episodes[currentEpIndex - 1].id}\`);
    }
  };

  const handleNext = () => {
    if (currentEpIndex < episodes.length - 1) {
      navigate(\`/watch/\${animeId}/\${episodes[currentEpIndex + 1].id}\`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to={\`/anime/\${animeId}\`} className="inline-flex items-center gap-2 text-kz-text-secondary hover:text-kz-accent transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to {anime.title}
      </Link>
      
      {/* Player Placeholder */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-kz-border shadow-2xl">
        <div className="text-center">
          <p className="text-kz-text-muted text-sm mb-2">MOCK PLAYER STATE</p>
          <h2 className="text-2xl font-bold text-white mb-2">{anime.title}</h2>
          <p className="text-kz-accent">Episode {currentEp?.number} - {currentEp?.title}</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-kz-card p-4 rounded-xl border border-kz-border">
        <button 
          onClick={handlePrev} 
          disabled={currentEpIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-kz-text-primary hover:bg-kz-card-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prev Episode
        </button>
        <span className="font-medium">Episode {currentEp?.number}</span>
        <button 
          onClick={handleNext} 
          disabled={currentEpIndex === episodes.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-kz-text-primary hover:bg-kz-card-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Next Episode <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-kz-card rounded-xl p-4 border border-kz-border">
        <h3 className="font-medium text-white mb-4">Episodes</h3>
        <div className="flex flex-wrap gap-2">
          {episodes.map(ep => (
            <Link 
              key={ep.id} 
              to={\`/watch/\${animeId}/\${ep.id}\`}
              className={\`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors \${
                ep.id === episodeId 
                  ? 'bg-kz-accent text-white' 
                  : 'bg-kz-bg text-kz-text-secondary hover:text-white hover:bg-kz-card-hover'
              }\`}
            >
              {ep.number}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`,

  'src/pages/Schedule.jsx': `
import React, { useEffect, useState } from 'react';
import { animeService } from '../services/animeService';
import Spinner from '../components/common/Spinner';
import HorizontalAnimeCard from '../components/anime/HorizontalAnimeCard';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Schedule() {
  const [schedule, setSchedule] = useState({});
  const [activeDay, setActiveDay] = useState("Monday");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    animeService.getSchedule().then(data => {
      setSchedule(data);
      // Auto set today
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (DAYS.includes(today)) setActiveDay(today);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Schedule</h1>
      
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={\`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors \${
              activeDay === day 
                ? 'bg-kz-accent text-white' 
                : 'bg-kz-card text-kz-text-secondary hover:bg-kz-card-hover hover:text-white'
            }\`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(schedule[activeDay] || []).map(anime => (
          <HorizontalAnimeCard key={anime.id} anime={anime} />
        ))}
        {(!schedule[activeDay] || schedule[activeDay].length === 0) && (
          <p className="text-kz-text-muted col-span-full">No anime scheduled for {activeDay}.</p>
        )}
      </div>
    </div>
  );
}
`,

  'src/pages/Watchlist.jsx': `
import React, { useEffect, useState } from 'react';
import { watchlistService } from '../services/watchlistService';
import HorizontalAnimeCard from '../components/anime/HorizontalAnimeCard';
import EmptyState from '../components/common/EmptyState';
import { Bookmark } from 'lucide-react';

const TABS = ["All", "Watching", "Completed", "On Hold", "Dropped", "Plan to Watch"];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    setWatchlist(watchlistService.getWatchlist());
  }, []);

  const filtered = activeTab === "All" 
    ? watchlist 
    : watchlist.filter(item => item.status === activeTab);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Watchlist</h1>
      
      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar border-b border-kz-border">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={\`px-4 py-3 font-medium whitespace-nowrap transition-colors relative \${
              activeTab === tab 
                ? 'text-kz-accent' 
                : 'text-kz-text-secondary hover:text-white'
            }\`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-kz-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={\`No anime in \${activeTab}\`} icon={Bookmark} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.anime.id} className="relative">
              <HorizontalAnimeCard anime={item.anime} />
              <div className="absolute top-2 right-2 text-[10px] bg-kz-bg px-2 py-1 rounded text-kz-text-secondary">
                {item.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`,

  'src/pages/Search.jsx': `
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import AnimeCard from '../components/anime/AnimeCard';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    animeService.searchAnime(query).then(data => {
      setResults(data);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">
        {query ? \`Search Results for "\${query}"\` : 'Browse Anime'}
      </h1>
      
      {loading ? (
        <Spinner fullScreen />
      ) : results.length === 0 ? (
        <EmptyState message="No results found." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map(anime => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}
`,

  'src/pages/Profile.jsx': `
import React from 'react';
import { mockProfile } from '../data/mock/mockData';

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-kz-card rounded-2xl p-8 border border-kz-border flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <img src={mockProfile.avatar} alt="Avatar" className="w-32 h-32 rounded-full bg-kz-bg-secondary" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{mockProfile.username}</h1>
          <p className="text-kz-text-secondary">{mockProfile.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(mockProfile.stats).map(([key, value]) => (
          <div key={key} className="bg-kz-card border border-kz-border rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-kz-accent mb-2">{value}</div>
            <div className="text-xs text-kz-text-secondary uppercase tracking-wider">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`
};

function ensureDir(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDir(dirname);
  fs.mkdirSync(dirname);
}

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filePath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\\n');
}

console.log('Successfully created all UI components and pages.');
