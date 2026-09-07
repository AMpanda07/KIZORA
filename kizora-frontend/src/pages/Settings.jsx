import React from 'react';
import { Settings as SettingsIcon, Monitor, Play, Sliders, Trash2, Check } from 'lucide-react';
import { useSettings, useWatchHistory, useWatchlist } from '../hooks/useStorage';

const Settings = () => {
  const { settings, updateSetting } = useSettings();
  const { clearHistory } = useWatchHistory();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Customize your playback, interface, and storage preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Playback Section ──────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-4">
            <Play className="w-4 h-4 text-[var(--accent-hover)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Playback
            </h2>
          </div>

          <div className="space-y-4 divide-y divide-[var(--border-subtle)] text-xs">
            <div className="flex items-center justify-between pt-3 first:pt-0">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  Autoplay next episode
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Automatically transition to the next episode when current finishes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoplayNext}
                onChange={(e) => updateSetting('autoplayNext', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  Auto-play video on load
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Start streaming automatically when navigating to the watch page
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => updateSetting('autoPlay', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  Default quality
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Target resolution for HLS live streams
                </p>
              </div>
              <select
                value={settings.defaultQuality}
                onChange={(e) => updateSetting('defaultQuality', e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Interface Section ─────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-4">
            <Sliders className="w-4 h-4 text-[var(--accent-hover)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Interface
            </h2>
          </div>

          <div className="space-y-4 divide-y divide-[var(--border-subtle)] text-xs">
            <div className="flex items-center justify-between pt-3 first:pt-0">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  Compact anime cards
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Show denser grids with tighter poster spacing
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.compactCards}
                onChange={(e) => updateSetting('compactCards', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  Reduce animations
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Minimize card hover motion and transitions
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceAnimations}
                onChange={(e) => updateSetting('reduceAnimations', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ── Storage & Reset Section ───────────────────────── */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-4">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Local Storage
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                Clear watch history & cache
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Removes all stored continue-watching progress from your device
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your viewing history?')) {
                  clearHistory();
                  alert('Watch history cleared.');
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-rose-400 bg-rose-950/30 border border-rose-900/40 hover:bg-rose-900/40 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
