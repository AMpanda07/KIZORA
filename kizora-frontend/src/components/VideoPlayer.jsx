import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Layers,
  Check
} from 'lucide-react';

const VideoPlayer = ({ src, poster, title, sources = [], servers = [] }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [currentSrc, setCurrentSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('Auto HLS');

  const controlsTimeoutRef = useRef(null);
  const hlsRef = useRef(null);

  // Update currentSrc when prop changes
  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
    }
  }, [src]);

  // HLS Engine Integration
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    // Check if source is HLS (.m3u8)
    const isHlsSource = currentSrc.includes('.m3u8') || currentSrc.includes('m3u8');

    if (isHlsSource) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.loadSource(currentSrc);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isPlaying) {
            video.play().catch(e => console.warn('HLS auto-play prevented:', e));
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS media error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari / iOS)
        video.src = currentSrc;
      }
    } else {
      // Standard MP4 stream
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = currentSrc;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSrc]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Time Update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Duration Update
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle Seek
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    videoRef.current.muted = newMuteState;
  };

  // Skip seconds
  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.error(err));
    }
  };

  // Mouse idle detection
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowQualityMenu(false);
      }, 3500);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSourceSelect = (source) => {
    setCurrentSrc(source.url);
    setSelectedQuality(source.quality);
    setShowQualityMenu(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && (setShowControls(false), setShowQualityMenu(false))}
      className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 group select-none"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Center Play Overlay when paused */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer transition-all duration-300"
        >
          <div className="w-20 h-20 rounded-full bg-cyan-400/90 text-black flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.8)] transform scale-90 hover:scale-100 transition-transform">
            <Play className="w-10 h-10 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Settings / Server Selection Popover */}
      {showQualityMenu && (
        <div className="absolute bottom-20 right-6 z-40 w-56 p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] text-xs flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-2 py-1 text-zinc-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-white/10 mb-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stream Source / Quality</span>
          </div>
          {sources && sources.length > 0 ? (
            sources.map((srcItem, index) => (
              <button
                key={index}
                onClick={() => handleSourceSelect(srcItem)}
                className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                  currentSrc === srcItem.url
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>{srcItem.quality}</span>
                {currentSrc === srcItem.url && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-zinc-400">Default HLS Engine</div>
          )}
        </div>
      )}

      {/* Floating Antigravity Control Bar */}
      <div
        className={`absolute bottom-4 left-4 right-4 z-30 backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl px-5 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-opacity duration-300 flex flex-col gap-2 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar Seeker */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2.5 transition-all"
            style={{
              background: `linear-gradient(to right, #22d3ee ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 0%)`
            }}
          />
        </div>

        {/* Control Actions */}
        <div className="flex items-center justify-between">
          {/* Left Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 text-white hover:text-cyan-400 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            <button
              onClick={() => skip(-10)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-cyan-400 transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skip(10)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-cyan-400 transition-colors"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono text-zinc-300">
              <span className="text-cyan-300">{formatTime(currentTime)}</span>
              <span className="text-zinc-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Server / Quality Menu Toggle */}
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 text-white hover:text-cyan-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Stream Quality & Servers"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-zinc-300">{selectedQuality}</span>
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-zinc-300 hover:text-cyan-400 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 text-white hover:text-cyan-400 transition-all"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
