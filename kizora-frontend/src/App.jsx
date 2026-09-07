import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import BottomNav from './components/BottomNav';
import { AnimeGridSkeleton } from './components/Skeletons';

// Route-level code splitting for performance optimization
const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'));
const Watch = lazy(() => import('./pages/Watch'));
const Genres = lazy(() => import('./pages/Genres'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Library = lazy(() => import('./pages/Library'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
    <AnimeGridSkeleton count={8} />
  </div>
);

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Global Top Header Bar */}
        <TopHeader sidebarCollapsed={sidebarCollapsed} />

        {/* Responsive Content Container */}
        <main
          className={`transition-all duration-200 pt-16 pb-16 md:pb-6 ${
            sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[220px]'
          }`}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/watch/:episodeId" element={<Watch />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/library" element={<Library />} />
              <Route path="/history" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/community" element={<Home />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>

        {/* Mobile Bottom Navigation (visible only on <md screens) */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
