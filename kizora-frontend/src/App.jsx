import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Watch from './pages/Watch';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: '#0F0A1E', color: '#E2D9F3' }}>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Home />} />
          <Route path="/community" element={<Home />} />
          <Route path="/library" element={<Home />} />
          <Route path="/directory" element={<Home />} />
          <Route path="/watch/:episodeId" element={<Watch />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
