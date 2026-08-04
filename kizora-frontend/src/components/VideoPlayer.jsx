import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, RotateCw,
  Settings, Layers, Check, Loader2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// VideoPlayer — accepts `videoUrl` prop (HLS .m3u8 or MP4), auto-destroys &
// re-initialises the HLS instance whenever `videoUrl` changes.
// Styled in the KIZORA Antigravity theme: dark glass controls, neon purple glow.
// ─────────────────────────────────────────────────────────────────────────────

const VideoPlayer = ({
  videoUrl,        // primary: HLS .m3u8 or MP4 URL
  src,             // legacy alias — treated identically to videoUrl
  poster,
  title,
  sources = [],    // [{url, quality, isHLS}] — extra quality options
  servers = [],    // [{name, id}] — server labels
}) => {
  // Resolve the URL from either prop
  const resolvedUrl = videoUrl || src || '';

  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const hlsRef       = useRef(null);
  const hideTimer    = useRef(null);

  const [currentSrc,     setCurrentSrc]     = useState(resolvedUrl);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [isBuffering,    setIsBuffering]    = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolume]         = useState(1);
  const [isMuted,        setIsMuted]        = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [showControls,   setShowControls]   = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('Auto');

  // ── Sync currentSrc whenever the parent URL changes ──────────────────────
  useEffect(() => {
    const incoming = videoUrl || src || '';
    if (incoming && incoming !== currentSrc) {
      setCurrentSrc(incoming);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [videoUrl, src]); // eslint-disable-line

  // ── HLS engine: destroy previous instance & mount new one ────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    // Tear down existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = currentSrc.includes('.m3u8') || currentSrc.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:    true,
        lowLatencyMode:  true,
        backBufferLength: 90,
        maxBufferLength: 30,
      });

      hls.loadSource(currentSrc);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });

    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = currentSrc;
    } else {
      // Plain MP4
      video.src = currentSrc;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSrc]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // ── Playback handlers ─────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else          { v.pause(); setIsPlaying(false); }
  };

  const skip = (sec) => {
    if (videoRef.current) videoRef.current.currentTime += sec;
  };

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const handleSourceSelect = (s) => {
    setCurrentSrc(s.url);
    setSelectedQuality(s.quality);
    setShowQualityMenu(false);
    setIsPlaying(false);
  };

  const fmt = (s) => {
    if (isNaN(s) || s === Infinity) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && (setShowControls(false), setShowQualityMenu(false))}
      className="relative w-full select-none overflow-hidden"
      style={{
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: '16px',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow: '0 0 40px -8px rgba(124,58,237,0.5), 0 20px 60px rgba(0,0,0,0.8)',
      }}
    >
      {/* ── HTML5 <video> ───────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        poster={poster}
        onClick={togglePlay}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* ── Buffering spinner ───────────────────────────────────────────── */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2
            className="w-14 h-14 animate-spin"
            style={{ color: '#8B5CF6', filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.8))' }}
          />
        </div>
      )}

      {/* ── Paused center-play overlay ──────────────────────────────────── */}
      {!isPlaying && !isBuffering && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
              boxShadow: '0 0 50px rgba(124,58,237,0.9)',
            }}
          >
            <Play className="w-9 h-9 text-white fill-current ml-1" />
          </div>
        </div>
      )}

      {/* ── Title watermark (top-left, fades with controls) ─────────────── */}
      {title && showControls && (
        <div
          className="absolute top-4 left-5 text-sm font-semibold transition-opacity duration-300 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
        >
          {title}
        </div>
      )}

      {/* ── Quality / Source popover ─────────────────────────────────────── */}
      {showQualityMenu && (
        <div
          className="absolute bottom-20 right-5 z-40 w-56 p-3 rounded-2xl text-xs flex flex-col gap-1"
          style={{
            background: 'rgba(15,10,30,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
        >
          <div
            className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ borderBottom: '1px solid rgba(124,58,237,0.15)', color: '#7B6EA8' }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />
            Stream Source
          </div>

          {sources.length > 0 ? sources.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSourceSelect(s)}
              className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all duration-200"
              style={{
                background: currentSrc === s.url ? 'rgba(124,58,237,0.2)' : 'transparent',
                border: currentSrc === s.url ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                color: currentSrc === s.url ? '#C4B5FD' : '#A1A1AA',
              }}
              onMouseEnter={e => { if (currentSrc !== s.url) e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
              onMouseLeave={e => { if (currentSrc !== s.url) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{s.quality}</span>
              {currentSrc === s.url && <Check className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />}
            </button>
          )) : (
            <div className="px-3 py-2" style={{ color: '#7B6EA8' }}>Auto HLS Engine</div>
          )}
        </div>
      )}

      {/* ── Floating Control Bar ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-3 left-3 right-3 z-30 flex flex-col gap-2 px-4 py-3 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(15,10,30,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        {/* Progress bar */}
        <div className="relative w-full group/progress flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            step={0.1}
            onChange={handleSeek}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8B5CF6 ${progress}%, rgba(139,92,246,0.25) ${progress}%)`,
              accentColor: '#8B5CF6',
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left cluster */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#E2D9F3' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 fill-current" />
                : <Play  className="w-4 h-4 fill-current" />}
            </button>

            {/* Skip back */}
            <button onClick={() => skip(-10)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#A1A1AA' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C4B5FD'}
              onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
              title="Rewind 10s">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip forward */}
            <button onClick={() => skip(10)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#A1A1AA' }}
              onMouseEnter={e => e.currentTarget.style.color = '#C4B5FD'}
              onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
              title="Forward 10s">
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Timestamp */}
            <span className="text-xs font-mono hidden sm:block" style={{ color: '#A1A1AA' }}>
              <span style={{ color: '#C4B5FD' }}>{fmt(currentTime)}</span>
              <span style={{ color: '#4B3E7A', margin: '0 4px' }}>/</span>
              {fmt(duration)}
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {/* Quality selector */}
            <button
              onClick={() => setShowQualityMenu(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: showQualityMenu ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.25)',
                color: '#C4B5FD',
              }}
              title="Stream Quality"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedQuality}</span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <button onClick={toggleMute} className="transition-colors" style={{ color: '#A1A1AA' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C4B5FD'}
                onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}>
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4" style={{ color: '#EF4444' }} />
                  : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#8B5CF6' }}
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#E2D9F3' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
            >
              {isFullscreen
                ? <Minimize className="w-4 h-4" />
                : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
