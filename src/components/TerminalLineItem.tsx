import React, { useState } from 'react';
import {
  Check,
  Copy,
  Play,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronRight,
  HelpCircle,
  FileCode,
  Wrench
} from 'lucide-react';
import { TerminalLine, TerminalTheme } from '../types';

interface TerminalLineItemProps {
  line: TerminalLine;
  theme: TerminalTheme;
  onRunCommand: (cmd: string) => void;
  onExplainCommand: (cmd: string) => void;
}

export const TerminalLineItem: React.FC<TerminalLineItemProps> = ({
  line,
  theme,
  onRunCommand,
  onExplainCommand
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeTextColors = () => {
    switch (theme) {
      case 'matrix':
        return {
          cmdPrompt: 'text-green-400 font-bold',
          stdout: 'text-green-300 font-mono',
          tableHeader: 'text-green-400 border-green-800 bg-green-950/40',
          tableCell: 'border-green-900/50 text-green-300'
        };
      case 'retro_amber':
        return {
          cmdPrompt: 'text-amber-400 font-bold',
          stdout: 'text-amber-300 font-mono',
          tableHeader: 'text-amber-400 border-amber-800 bg-amber-950/40',
          tableCell: 'border-amber-900/50 text-amber-300'
        };
      case 'dracula':
        return {
          cmdPrompt: 'text-purple-300 font-bold',
          stdout: 'text-pink-200 font-mono',
          tableHeader: 'text-purple-300 border-purple-800 bg-purple-950/40',
          tableCell: 'border-purple-900/50 text-pink-200'
        };
      case 'cyberpunk':
        return {
          cmdPrompt: 'text-cyan-400 font-bold',
          stdout: 'text-cyan-100 font-mono',
          tableHeader: 'text-cyan-400 border-cyan-800 bg-cyan-950/40',
          tableCell: 'border-cyan-900/50 text-cyan-200'
        };
      case 'cmd':
        return {
          cmdPrompt: 'text-neutral-200 font-bold',
          stdout: 'text-neutral-300 font-mono',
          tableHeader: 'text-neutral-200 border-neutral-700 bg-neutral-900',
          tableCell: 'border-neutral-800 text-neutral-300'
        };
      case 'powershell':
      default:
        return {
          cmdPrompt: 'text-yellow-300 font-semibold',
          stdout: 'text-neutral-200 font-mono',
          tableHeader: 'text-cyan-300 border-blue-800/80 bg-blue-950/60 font-semibold',
          tableCell: 'border-blue-950/80 text-neutral-200'
        };
    }
  };

  const themeColors = getThemeTextColors();

  // 1. COMMAND PROMPT LINE
  if (line.type === 'command') {
    const isCmd = line.mode === 'cmd';
    return (
      <div className="flex items-start gap-2 my-1.5 font-mono text-sm group">
        <span className={themeColors.cmdPrompt}>
          {isCmd ? `${line.path || 'C:\\Users\\Admin'}>` : `PS ${line.path || 'C:\\Users\\Admin'}>`}
        </span>
        <span className="text-white font-medium break-all flex-1">{line.commandText}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => onExplainCommand(line.commandText || '')}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-blue-300 text-xs flex items-center gap-1"
            title="Explain with AI"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span className="text-[10px]">Explain</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. STDOUT LINE
  if (line.type === 'stdout') {
    return (
      <div className={`my-1 whitespace-pre-wrap text-sm break-words font-mono ${themeColors.stdout}`}>
        {line.text}
      </div>
    );
  }

  // 3. STDERR LINE (Error Output with AI Fix Option)
  if (line.type === 'stderr') {
    return (
      <div className="my-2 p-2.5 rounded bg-red-950/40 border border-red-800/60 font-mono text-sm text-red-300 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <pre className="whitespace-pre-wrap font-mono text-xs text-red-200 flex-1 break-words">
            {line.text}
          </pre>
        </div>

        {line.aiDetails?.suggestedFixCommand && (
          <div className="mt-1 pt-2 border-t border-red-900/60 flex items-center justify-between gap-2 bg-red-900/20 p-2 rounded">
            <div className="flex items-center gap-1.5 text-xs text-red-200">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggested AI Fix:</span>
              <code className="bg-black/50 text-amber-300 px-2 py-0.5 rounded font-mono text-xs">
                {line.aiDetails.suggestedFixCommand}
              </code>
            </div>
            <button
              onClick={() => onRunCommand(line.aiDetails?.suggestedFixCommand || '')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Fix & Run</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. TABLE DATA LINE (PowerShell Get-ChildItem, Get-Process, etc.)
  if (line.type === 'table' && line.tableData) {
    return (
      <div className="my-2 overflow-x-auto rounded border border-white/10 shadow-inner">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className={themeColors.tableHeader}>
              {line.tableData.columns.map((col) => (
                <th key={col.key} className={`px-3 py-1.5 font-semibold ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {line.tableData.rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-white/5 border-b border-white/5 transition-colors"
              >
                {line.tableData!.columns.map((col) => (
                  <td key={col.key} className={`px-3 py-1 font-mono ${themeColors.tableCell}`}>
                    {row[col.key] !== undefined ? String(row[col.key]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 5. AI TRANSLATION BADGE / RESULT
  if (line.type === 'ai_translation' && line.aiDetails) {
    const risk = line.aiDetails.riskLevel || 'safe';
    const riskBg =
      risk === 'dangerous'
        ? 'bg-red-950/80 border-red-700/80 text-red-300'
        : risk === 'warning'
        ? 'bg-amber-950/80 border-amber-700/80 text-amber-300'
        : 'bg-blue-950/80 border-blue-700/80 text-blue-200';

    return (
      <div className={`my-3 p-3.5 rounded-lg border shadow-lg ${riskBg} font-mono text-xs flex flex-col gap-2.5`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="font-semibold tracking-wide uppercase text-[11px] text-blue-300">
              AI Command Generator
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-white/20">
            Risk: {risk}
          </span>
        </div>

        <div>
          <div className="text-neutral-400 mb-1 text-[11px]">Prompt: "{line.aiDetails.originalPrompt}"</div>
          <div className="flex items-center justify-between gap-2 bg-black/60 p-2.5 rounded border border-white/10 font-mono text-sm text-cyan-300">
            <code className="break-all font-semibold">{line.aiDetails.translatedCommand}</code>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleCopy(line.aiDetails?.translatedCommand || '')}
                className="p-1.5 hover:bg-white/10 rounded text-neutral-300"
                title="Copy Command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onRunCommand(line.aiDetails?.translatedCommand || '')}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition-colors text-xs"
              >
                <Play className="w-3 h-3" />
                <span>Execute</span>
              </button>
            </div>
          </div>
        </div>

        {line.aiDetails.explanation && (
          <div className="text-neutral-300 leading-relaxed text-[11px] bg-white/5 p-2 rounded">
            {line.aiDetails.explanation}
          </div>
        )}
      </div>
    );
  }

  // 6. SYSTEM LINE
  if (line.type === 'system') {
    return (
      <div className="my-1.5 px-3 py-1 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 font-mono text-xs flex items-center gap-2">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>{line.text}</span>
      </div>
    );
  }

  // 7. SCRIPT CODE OUTPUT
  if (line.type === 'script_code') {
    return (
      <div className="my-2 p-3 bg-neutral-900 border border-emerald-800/60 rounded font-mono text-xs text-emerald-300 whitespace-pre-wrap shadow-inner">
        <div className="flex items-center gap-2 border-b border-emerald-900/60 pb-1.5 mb-2 text-emerald-400 font-semibold">
          <FileCode className="w-4 h-4" />
          <span>Script Execution Output</span>
        </div>
        {line.text}
      </div>
    );
  }

  return (
    <div className="my-1 font-mono text-sm text-neutral-300 break-words">
      {line.text}
    </div>
  );
};
