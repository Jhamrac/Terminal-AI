import React, { useState } from 'react';
import { FileCode, X, Play, Save, Plus, Trash2, CheckCircle, Terminal } from 'lucide-react';
import { SavedScript } from '../types';

interface ScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScript: (filename: string, content: string) => void;
  onSaveToVFS: (path: string, content: string) => void;
}

const DEFAULT_SCRIPTS: SavedScript[] = [
  {
    id: '1',
    filename: 'ServerStatus.ps1',
    path: 'C:\\Users\\Admin\\Scripts\\ServerStatus.ps1',
    language: 'ps1',
    createdAt: '2026-08-29 10:00:00',
    content: `# Server Health & Diagnostics Script
param (
    [string]$ServerName = "localhost"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running System Health Check for $ServerName " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$cpu = Get-Random -Minimum 5 -Maximum 40
$ram = Get-Random -Minimum 20 -Maximum 65

Write-Host "CPU Usage: $cpu%" -ForegroundColor Yellow
Write-Host "RAM Usage: $ram%" -ForegroundColor Yellow
Write-Host "Services: WinDefend, EventLog, Dhcp active" -ForegroundColor Green
Write-Host "Status: ALL SYSTEMS OPERATIONAL" -ForegroundColor Cyan
`
  },
  {
    id: '2',
    filename: 'AutoBackup.ps1',
    path: 'C:\\Users\\Admin\\Scripts\\AutoBackup.ps1',
    language: 'ps1',
    createdAt: '2026-08-28 14:00:00',
    content: `# Documents Backup Script
$source = "C:\\Users\\Admin\\Documents"
$destination = "C:\\Backups\\Docs_" + (Get-Date -Format "yyyyMMdd_HHmmss")

Write-Host "Initiating backup from $source to $destination..." -ForegroundColor Green
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Copy-Item -Path "$source\\*" -Destination $destination -Recurse -Force
Write-Host "Backup completed successfully!" -ForegroundColor Cyan
`
  }
];

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  isOpen,
  onClose,
  onRunScript,
  onSaveToVFS
}) => {
  const [scripts, setScripts] = useState<SavedScript[]>(DEFAULT_SCRIPTS);
  const [activeScriptId, setActiveScriptId] = useState<string>('1');
  const [editorContent, setEditorContent] = useState<string>(DEFAULT_SCRIPTS[0].content);
  const [scriptName, setScriptName] = useState<string>(DEFAULT_SCRIPTS[0].filename);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  if (!isOpen) return null;

  const activeScript = scripts.find((s) => s.id === activeScriptId) || scripts[0];

  const handleSelectScript = (s: SavedScript) => {
    setActiveScriptId(s.id);
    setEditorContent(s.content);
    setScriptName(s.filename);
  };

  const handleCreateNewScript = () => {
    const newScript: SavedScript = {
      id: crypto.randomUUID(),
      filename: 'NewScript.ps1',
      path: 'C:\\Users\\Admin\\Scripts\\NewScript.ps1',
      language: 'ps1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      content: `# New PowerShell Automation Script\nWrite-Host "Executing Automation..." -ForegroundColor Green\n`
    };
    setScripts([...scripts, newScript]);
    setActiveScriptId(newScript.id);
    setEditorContent(newScript.content);
    setScriptName(newScript.filename);
  };

  const handleSave = () => {
    const updated = scripts.map((s) =>
      s.id === activeScriptId ? { ...s, filename: scriptName, content: editorContent } : s
    );
    setScripts(updated);
    onSaveToVFS(`C:\\Users\\Admin\\Scripts\\${scriptName}`, editorContent);
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const handleRun = () => {
    handleSave();
    onRunScript(scriptName, editorContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col text-neutral-200 overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm text-white">PowerShell Script Architect &amp; Runner</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Script List */}
          <div className="w-64 border-r border-neutral-800 bg-neutral-950/60 p-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-semibold text-neutral-300">Saved Scripts (.ps1)</span>
                <button
                  onClick={handleCreateNewScript}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 text-[11px]"
                  title="New Script"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-1">
                {scripts.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectScript(s)}
                    className={`p-2 rounded cursor-pointer font-mono text-xs flex items-center gap-2 transition-colors ${
                      s.id === activeScriptId
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{s.filename}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-[11px] text-neutral-400">
              Target Folder: <code className="text-emerald-300">C:\Users\Admin\Scripts</code>
            </div>
          </div>

          {/* Right Script Code Editor */}
          <div className="flex-1 flex flex-col p-4 bg-neutral-900/90 overflow-hidden space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <input
                type="text"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                className="bg-black/60 border border-neutral-700 font-mono text-xs font-semibold text-emerald-300 px-2.5 py-1 rounded focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center gap-2">
                {showSavedMsg && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved to VFS!
                  </span>
                )}
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold text-xs rounded transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute in Terminal</span>
                </button>
              </div>
            </div>

            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-1 bg-black/90 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-emerald-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
