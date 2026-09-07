import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Tag,
  Calendar,
  Users,
  Bookmark,
  Clock,
  User,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const mainNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Browse', path: '/browse' },
  { icon: Tag, label: 'Genres', path: '/genres' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Users, label: 'Community', path: '/community' },
];

const libraryItems = [
  { icon: Bookmark, label: 'Watchlist', path: '/library?tab=watchlist' },
  { icon: Clock, label: 'History', path: '/history' },
];

const accountItems = [
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      return location.pathname === base && location.search.includes(query);
    }
    return location.pathname.startsWith(path);
  };

  const renderNavGroup = (items, groupTitle) => (
    <div className="mb-4">
      {!collapsed && groupTitle && (
        <p className="px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          {groupTitle}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map(({ icon: Icon, label, path }) => {
          const active = isLinkActive(path);
          return (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-[var(--bg-elevated)] text-[var(--accent-hover)] font-semibold border-l-2 border-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-30 bg-[var(--bg-surface)] border-r border-[var(--border)] transition-all duration-200 select-none ${
        collapsed ? 'w-[72px]' : 'w-[220px]'
      }`}
    >
      {/* ── Brand / Logo ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border)] flex-shrink-0">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base tracking-wider text-[var(--text-primary)]">
              KIZORA
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Navigation groups ──────────────────────────────── */}
      <div className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar">
        {renderNavGroup(mainNavItems, 'Discover')}
        {renderNavGroup(libraryItems, 'Library')}
        {renderNavGroup(accountItems, 'Account')}
      </div>

      {/* ── Sidebar Footer / Version ───────────────────────── */}
      {!collapsed && (
        <div className="p-3 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] text-center">
          KIZORA &bull; Anime Catalogue
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
