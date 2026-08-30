import React from 'react';
import {
  Terminal,
  Plus,
  X,
  Bot,
  FolderTree,
  FileCode,
  Settings,
  Sparkles,
  Shield,
  Trash2,
  Minimize2,
  Square,
  Maximize2
} from 'lucide-react';
import { TabSession, TerminalMode } from '../types';

interface TerminalHeaderProps {
  tabs: TabSession[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: (mode: TerminalMode) => void;
  onCloseTab: (id: string) => void;
  onToggleCopilot: () => void;
  onToggleExplorer: () => void;
  onToggleScriptEditor: () => void;
  onToggleSettings: () => void;
  onClearTerminal: () => void;
  isCopilotOpen: boolean;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onToggleCopilot,
  onToggleExplorer,
  onToggleScriptEditor,
  onToggleSettings,
  onClearTerminal,
  isCopilotOpen
}) => {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const getModeLabel = (mode: TerminalMode) => {
    switch (mode) {
      case 'powershell':
        return 'Windows PowerShell (x64)';
      case 'pwsh7':
        return 'PowerShell 7.4.2 Core';
      case 'cmd':
        return 'Command Prompt (CMD)';
    }
  };

  const getModeBadgeClass = (mode: TerminalMode) => {
    switch (mode) {
      case 'powershell':
        return 'bg-blue-600/30 text-blue-300 border-blue-500/40';
      case 'pwsh7':
        return 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40';
      case 'cmd':
        return 'bg-neutral-800 text-neutral-300 border-neutral-600/50';
    }
  };

  return (
    <header className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-neutral-200 select-none flex flex-col">
      {/* Top Window Title Bar (Windows 11 Style) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-xs border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-neutral-300 tracking-tight">
            Administrator: {getModeLabel(activeTab?.mode || 'powershell')}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
            <Shield className="w-2.5 h-2.5" />
            ELEVATED
          </span>
        </div>

        <div className="flex items-center gap-1 text-neutral-400">
          <div className="px-2 py-0.5 hover:bg-neutral-800 rounded transition-colors cursor-pointer">
            <Minimize2 className="w-3 h-3" />
          </div>
          <div className="px-2 py-0.5 hover:bg-neutral-800 rounded transition-colors cursor-pointer">
            <Square className="w-2.5 h-2.5" />
          </div>
          <div className="px-2 py-0.5 hover:bg-red-600 hover:text-white rounded transition-colors cursor-pointer">
            <X className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1 gap-2 overflow-x-auto">
        {/* Tab List */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all border-t border-x ${
                  isActive
                    ? 'bg-neutral-800/90 text-neutral-100 border-neutral-700 shadow-sm'
                    : 'bg-neutral-900/60 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200 border-transparent'
                }`}
              >
                <Terminal className={`w-3.5 h-3.5 ${tab.mode === 'cmd' ? 'text-neutral-400' : 'text-blue-400'}`} />
                <span className="max-w-[120px] truncate font-medium">{tab.title}</span>

                <span className={`text-[9px] px-1 rounded border font-mono ${getModeBadgeClass(tab.mode)}`}>
                  {tab.mode.toUpperCase()}
                </span>

                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-red-400 transition-opacity"
                    title="Close Tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* New Tab Dropdown Button */}
          <div className="relative group">
            <button
              onClick={() => onNewTab(activeTab?.mode || 'powershell')}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
              title="New PowerShell Tab"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 p-1 min-w-[170px]">
              <button
                onClick={() => onNewTab('powershell')}
                className="flex items-center gap-2 text-xs text-neutral-300 hover:bg-blue-900/40 hover:text-blue-200 px-2.5 py-1.5 rounded font-mono"
              >
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Windows PowerShell
              </button>
              <button
                onClick={() => onNewTab('pwsh7')}
                className="flex items-center gap-2 text-xs text-neutral-300 hover:bg-cyan-900/40 hover:text-cyan-200 px-2.5 py-1.5 rounded font-mono"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                PowerShell 7 Core
              </button>
              <button
                onClick={() => onNewTab('cmd')}
                className="flex items-center gap-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white px-2.5 py-1.5 rounded font-mono"
              >
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                Command Prompt (CMD)
              </button>
            </div>
          </div>
        </div>

        {/* Right Tools & AI Copilot Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleExplorer}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition-colors"
            title="Browse C:\ File System"
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">VFS Explorer</span>
          </button>

          <button
            onClick={onToggleScriptEditor}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-800/80 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60 transition-colors"
            title="Open Script Architect"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Script Runner</span>
          </button>

          <button
            onClick={onClearTerminal}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
            title="Clear Screen (cls)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleSettings}
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
            title="Terminal Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Local Agent Pair Download */}
          <a
            href="/api/agent/download-script?type=ps1"
            download="Agent.ps1"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
            title="Download Local Physical Machine Agent (Agent.ps1)"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pair Real PC</span>
          </a>

          {/* AI Copilot Toggle Button */}
          <button
            onClick={onToggleCopilot}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border transition-all ${
              isCopilotOpen
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-900/40'
                : 'bg-blue-950/60 text-blue-300 hover:bg-blue-900/80 border-blue-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
