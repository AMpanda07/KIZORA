import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Calendar, Bookmark, User } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-kz-surface border-r border-kz-border min-h-screen fixed left-0 top-0 bottom-0 z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-kz-primary">KIZORA</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded transition-colors ${
                isActive 
                  ? 'bg-kz-primary text-white' 
                  : 'text-kz-muted hover:bg-kz-card hover:text-kz-text'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
