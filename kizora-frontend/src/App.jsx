import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Schedule } from './pages/Schedule';
import { Watchlist } from './pages/Watchlist';
import { AnimeDetails } from './pages/AnimeDetails';
import { Watch } from './pages/Watch';
import { Profile } from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="anime/:id" element={<AnimeDetails />} />
        <Route path="watch/:animeId/:episodeId" element={<Watch />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
