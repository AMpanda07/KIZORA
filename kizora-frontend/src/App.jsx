import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Watch from './pages/Watch';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0C10] text-zinc-100 relative">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/directory" element={<Home />} />
          <Route path="/watch/:episodeId" element={<Watch />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
