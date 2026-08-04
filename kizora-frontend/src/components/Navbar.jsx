import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Home as HomeIcon, Film } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-6 py-3 w-[90%] max-w-4xl flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:scale-105 transition-transform">
          <Film className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-wider">
          KIZORA
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-cyan-400 transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          to="/directory"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-cyan-400 transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Directory</span>
        </Link>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Search"
          className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-400 transition-all duration-200"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
