import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, Home as HomeIcon, Sparkles } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-6 py-3 w-[90%] max-w-5xl flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)] group-hover:scale-105 transition-transform">
          <Sparkles className="w-4 h-4 text-white fill-current" />
        </div>
        <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          KIZORA
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          to="/directory"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-indigo-400 transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Directory</span>
        </Link>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/directory')}
          aria-label="Search"
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-400 transition-all duration-200"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
