import React from 'react';
import { Settings as SettingsIcon, X, Volume2, VolumeX, Monitor, Palette, Type } from 'lucide-react';
import { TerminalSettings, TerminalTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TerminalSettings;
  onUpdateSettings: (newSettings: Partial<TerminalSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const themes: { id: TerminalTheme; label: string; desc: string; bg: string }[] = [
    { id: 'powershell', label: 'Classic PowerShell', desc: 'Deep Blue canvas with Cyan headers & Yellow prompt', bg: 'bg-[#012456]' },
    { id: 'cmd', label: 'Command Prompt (CMD)', desc: 'Classic Windows CMD black background with green/white text', bg: 'bg-[#0c0c0c]' },
    { id: 'dracula', label: 'Dracula Dark', desc: 'Deep purple canvas with vibrant pink & cyan highlights', bg: 'bg-[#282a36]' },
    { id: 'matrix', label: 'Matrix Terminal', desc: 'Pure black canvas with glowing green text', bg: 'bg-[#000000]' },
    { id: 'retro_amber', label: 'Retro CRT Amber', desc: 'Vintage warm amber monospaced phosphor terminal', bg: 'bg-[#1a0f00]' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'High-contrast dark cyan and neon pink palette', bg: 'bg-[#080d1a]' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg p-5 text-neutral-200 select-none space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-base text-white">Terminal Environment Settings</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 text-xs">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-semibold text-neutral-300">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Color Theme Preset</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                    settings.theme === t.id
                      ? 'border-blue-500 bg-blue-950/40 shadow-sm shadow-blue-900/50'
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t.label}</span>
                    <div className={`w-3.5 h-3.5 rounded-full border border-white/20 ${t.bg}`} />
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Font Size & Cursor */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Font Size ({settings.fontSize}px)</span>
              </label>
              <input
                type="range"
                min={12}
                max={20}
                step={1}
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 block">Cursor Style</label>
              <select
                value={settings.cursorStyle}
                onChange={(e) => onUpdateSettings({ cursorStyle: e.target.value as any })}
                className="w-full bg-black/60 border border-neutral-700 rounded p-1.5 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="block">Solid Block (▋)</option>
                <option value="underline">Underline (_)</option>
                <option value="beam">Vertical Beam (|)</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-2">
                {settings.soundEffects ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                <div>
                  <span className="font-medium text-white block">Keyboard Click Audio</span>
                  <span className="text-[10px] text-neutral-400">Play soft mechanical click sounds as you type</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-medium text-white block">CRT Scanline Effect</span>
                  <span className="text-[10px] text-neutral-400">Authentic retro scanlines overlay</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.scanlines}
                onChange={(e) => onUpdateSettings({ scanlines: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition-colors"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
