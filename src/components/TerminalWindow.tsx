import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, TerminalMode, TerminalSettings, TerminalTheme } from '../types';
import { TerminalLineItem } from './TerminalLineItem';
import { playKeyClickSound, playEnterExecutionSound, playErrorSound } from '../lib/soundEffects';
import { Sparkles, Terminal as TerminalIcon, Send, ChevronRight } from 'lucide-react';

interface TerminalWindowProps {
  mode: TerminalMode;
  currentPath: string;
  history: TerminalLine[];
  commandHistoryList: string[];
  historyIndex: number;
  settings: TerminalSettings;
  onExecuteInput: (input: string) => void;
  onExplainCommand: (cmd: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => void;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  mode,
  currentPath,
  history,
  commandHistoryList,
  historyIndex,
  settings,
  onExecuteInput,
  onExplainCommand,
  onNavigateHistory
}) => {
  const [inputVal, setInputVal] = useState('');
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const bufferEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll buffer to bottom on new output
  useEffect(() => {
    bufferEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Focus input on click anywhere inside terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Keyboard handler for terminal input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (settings.soundEffects) {
      playKeyClickSound();
    }

    // Enter Key -> Submit Command
    if (e.key === 'Enter') {
      e.preventDefault();
      if (settings.soundEffects) {
        playEnterExecutionSound();
      }
      const submitted = inputVal;
      setInputVal('');
      setAutoCompleteSuggestions([]);
      onExecuteInput(submitted);
      return;
    }

    // Up / Down Arrow -> History Navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryList.length > 0) {
        const nextIdx = historyIndex < commandHistoryList.length - 1 ? historyIndex + 1 : historyIndex;
        onNavigateHistory('up');
        const cmd = commandHistoryList[commandHistoryList.length - 1 - nextIdx];
        if (cmd) setInputVal(cmd);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        onNavigateHistory('down');
        const nextIdx = historyIndex - 1;
        if (nextIdx < 0) {
          setInputVal('');
        } else {
          const cmd = commandHistoryList[commandHistoryList.length - 1 - nextIdx];
          if (cmd) setInputVal(cmd);
        }
      }
      return;
    }

    // Tab Key -> Auto-complete
    if (e.key === 'Tab') {
      e.preventDefault();
      if (autoCompleteSuggestions.length > 0) {
        setInputVal(autoCompleteSuggestions[selectedSuggestionIdx % autoCompleteSuggestions.length]);
      } else {
        // Quick path autocompletion fallback
        const commonPaths = ['Documents', 'Desktop', 'Projects', 'Scripts', 'Downloads', 'Get-Process', 'Get-Service', 'Get-ChildItem'];
        const match = commonPaths.find(p => p.toLowerCase().startsWith(inputVal.toLowerCase()));
        if (match) setInputVal(match);
      }
      return;
    }

    // Ctrl + L -> Clear screen
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onExecuteInput('cls');
      return;
    }
  };

  // Get background and styling based on theme
  const getThemeCanvasClass = (theme: TerminalTheme) => {
    switch (theme) {
      case 'powershell':
        return 'bg-[#012456] text-neutral-100 font-mono';
      case 'cmd':
        return 'bg-[#0c0c0c] text-neutral-200 font-mono';
      case 'dracula':
        return 'bg-[#282a36] text-[#f8f8f2] font-mono';
      case 'matrix':
        return 'bg-[#050b05] text-[#00ff66] font-mono shadow-[inset_0_0_100px_rgba(0,255,100,0.05)]';
      case 'retro_amber':
        return 'bg-[#120a00] text-[#ffb000] font-mono shadow-[inset_0_0_100px_rgba(255,176,0,0.05)]';
      case 'cyberpunk':
        return 'bg-[#060a17] text-[#00f0ff] font-mono';
      default:
        return 'bg-[#012456] text-neutral-100 font-mono';
    }
  };

  const getPromptLabel = () => {
    if (mode === 'cmd') {
      return `${currentPath}>`;
    }
    return `PS ${currentPath}>`;
  };

  const getPromptColor = (theme: TerminalTheme) => {
    switch (theme) {
      case 'powershell':
        return 'text-yellow-300';
      case 'cmd':
        return 'text-neutral-100 font-bold';
      case 'dracula':
        return 'text-purple-300';
      case 'matrix':
        return 'text-green-400 font-bold';
      case 'retro_amber':
        return 'text-amber-400 font-bold';
      case 'cyberpunk':
        return 'text-cyan-300 font-bold';
    }
  };

  const isAIPrefix = inputVal.trim().startsWith('ai ') || inputVal.trim().startsWith('? ');

  return (
    <div
      onClick={handleTerminalClick}
      className={`relative flex-1 flex flex-col p-4 overflow-y-auto cursor-text select-text ${getThemeCanvasClass(
        settings.theme
      )}`}
      style={{ fontSize: `${settings.fontSize}px` }}
    >
      {/* Optional CRT Scanlines Effect Overlay */}
      {settings.scanlines && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10 opacity-30" />
      )}

      {/* Terminal History Buffer */}
      <div className="space-y-1 z-0">
        {history.map((line) => (
          <TerminalLineItem
            key={line.id}
            line={line}
            theme={settings.theme}
            onRunCommand={(cmd) => onExecuteInput(cmd)}
            onExplainCommand={onExplainCommand}
          />
        ))}
        <div ref={bufferEndRef} />
      </div>

      {/* Active Input Line */}
      <div className="mt-2 flex items-center gap-2 z-0">
        <span className={`font-semibold shrink-0 select-none ${getPromptColor(settings.theme)}`}>
          {getPromptLabel()}
        </span>

        <div className="relative flex-1 flex items-center">
          {isAIPrefix && (
            <span className="absolute left-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-600/40 text-blue-300 border border-blue-500/50 font-mono shrink-0 select-none mr-2">
              <Sparkles className="w-3 h-3 text-blue-300 animate-pulse" />
              <span>AI</span>
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className={`w-full bg-transparent border-none outline-none font-mono text-white placeholder-white/30 ${
              isAIPrefix ? 'pl-14 text-cyan-200' : ''
            }`}
            placeholder={
              mode === 'cmd'
                ? "Type command or 'ai <prompt>'..."
                : "Type cmdlet, script or 'ai <prompt>'..."
            }
          />
        </div>
      </div>

      {/* Quick Helper Tip Footer */}
      <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-between font-mono select-none">
        <div className="flex items-center gap-3">
          <span>
            💡 <strong className="text-white/60">ai &lt;prompt&gt;</strong> or <strong className="text-white/60">? &lt;prompt&gt;</strong> for AI translation
          </span>
          <span>•</span>
          <span>Tab: Auto-complete</span>
          <span>•</span>
          <span>Ctrl+L: Clear</span>
        </div>
        <div>Mode: {mode.toUpperCase()}</div>
      </div>
    </div>
  );
};
