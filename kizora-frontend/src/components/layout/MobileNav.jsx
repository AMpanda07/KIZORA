import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Calendar, Bookmark, User } from 'lucide-react';

export const MobileNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-kz-surface border-t border-kz-border z-20 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-kz-primary' : 'text-kz-muted hover:text-kz-text'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
