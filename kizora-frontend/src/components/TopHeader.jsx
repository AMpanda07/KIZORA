import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bell, User, Search, X } from 'lucide-react';
import SearchBar from './SearchBar';

const TopHeader = ({ sidebarCollapsed }) => {
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-20 h-16 bg-[var(--bg-surface)] border-b border-[var(--border)] transition-all duration-200 ${
        sidebarCollapsed ? 'md:left-[72px]' : 'md:left-[220px]'
      }`}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Mobile: Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex md:hidden items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <div className="w-7 h-7 rounded-md bg-[var(--accent-primary)] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-bold text-sm tracking-wider text-[var(--text-primary)]">
            KIZORA
          </span>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden sm:block flex-1 max-w-md">
          <SearchBar />
        </div>

        {/* Mobile Search Toggle */}
        <div className="flex sm:hidden items-center">
          {mobileSearchOpen ? (
            <div className="fixed inset-x-0 top-0 h-16 bg-[var(--bg-surface)] px-4 flex items-center gap-2 z-50 border-b border-[var(--border)]">
              <div className="flex-1">
                <SearchBar autoFocus />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 text-[var(--text-secondary)] hover:text-white"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-white"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/library?tab=watchlist')}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="User profile"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
              <User className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
