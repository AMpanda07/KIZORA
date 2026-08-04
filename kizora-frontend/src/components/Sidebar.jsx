import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Compass, Film, BookMarked, Settings,
  Sparkles, ChevronRight, Bell, Search
} from 'lucide-react';

const navItems = [
  { icon: Home,       label: 'Home',      path: '/' },
  { icon: Compass,    label: 'Browse',    path: '/browse' },
  { icon: Film,       label: 'Community', path: '/community' },
  { icon: BookMarked, label: 'My Library',path: '/library' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '220px',
        background: 'rgba(15, 10, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(124, 58, 237, 0.12)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-7 pb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
            boxShadow: '0 0 20px rgba(124,58,237,0.6)',
          }}
          onClick={() => navigate('/')}
        >
          <Sparkles className="w-5 h-5 text-white fill-current" />
        </div>
        {!collapsed && (
          <span
            className="text-lg font-black tracking-wider"
            style={{
              background: 'linear-gradient(90deg, #fff 0%, #C4B5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap'
            }}
          >
            KIZORA
          </span>
        )}
      </div>

      {/* ── Search mini-bar ──────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 mb-6">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            onClick={() => navigate('/browse')}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#7B6EA8' }} />
            <span className="text-xs" style={{ color: '#7B6EA8' }}>Search anime...</span>
          </div>
        </div>
      )}

      {/* ── Section label ────────────────────────────────────── */}
      {!collapsed && (
        <p className="px-5 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4B3E7A' }}>
          Menu
        </p>
      )}

      {/* ── Nav Items ────────────────────────────────────────── */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'text-white'
                  : 'text-[#7B6EA8] hover:text-white'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(90deg, rgba(124,58,237,0.3) 0%, rgba(124,58,237,0.05) 100%)',
              borderLeft: '3px solid #7C3AED',
            } : {
              borderLeft: '3px solid transparent',
            }}
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? '#8B5CF6' : undefined }} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-semibold flex-1">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom section ───────────────────────────────────── */}
      <div className="px-3 pb-6 flex flex-col gap-1">
        {!collapsed && (
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4B3E7A' }}>
            Account
          </p>
        )}
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full"
          style={{ color: '#7B6EA8', borderLeft: '3px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7B6EA8'}
        >
          <Bell className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Notifications</span>}
        </button>
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full"
          style={{ color: '#7B6EA8', borderLeft: '3px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#7B6EA8'}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Settings</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 flex items-center justify-center w-8 h-8 rounded-lg mx-auto transition-all duration-200"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#8B5CF6',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight
            className="w-4 h-4 transition-transform duration-300"
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
