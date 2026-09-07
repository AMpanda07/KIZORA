import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '../common/Input';

export const TopNav = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-kz-bg/95 backdrop-blur border-b border-kz-border h-16 flex items-center justify-between px-4 md:px-8">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-kz-primary">KIZORA</h1>
      </div>
      
      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <form onSubmit={handleSearch}>
          <Input 
            icon={<Search size={18} />} 
            placeholder="Search anime..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="md:hidden flex items-center">
        {/* Placeholder for mobile actions if needed */}
      </div>
    </header>
  );
};
