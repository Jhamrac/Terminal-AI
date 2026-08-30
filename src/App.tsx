import React, { useState } from 'react';
import {
  FileNode,
  SavedScript,
  TabSession,
  TerminalLine,
  TerminalMode,
  TerminalSettings
} from './types';
import { INITIAL_VFS, createFile } from './lib/virtualFileSystem';
import { executeTerminalCommand } from './lib/terminalEngine';
import { TerminalHeader } from './components/TerminalHeader';
import { TerminalWindow } from './components/TerminalWindow';
import { CopilotPanel } from './components/CopilotPanel';
import { FileExplorerModal } from './components/FileExplorerModal';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_BANNER_LINE: TerminalLine = {
  id: 'banner_1',
  type: 'stdout',
  text: `Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows

💡 AI Copilot Active: Type "ai <prompt>" or "? <prompt>" to translate English into PowerShell commands!
`,
  timestamp: new Date().toLocaleTimeString()
};

export default function App() {
  // Virtual File System State
  const [vfs, setVfs] = useState<Record<string, FileNode>>(INITIAL_VFS);

  // Settings State
  const [settings, setSettings] = useState<TerminalSettings>({
    theme: 'powershell',
    fontSize: 14,
    fontFamily: 'Consolas',
    soundEffects: true,
    scanlines: false,
    blinkingCursor: true,
    cursorStyle: 'block',
    windowOpacity: 1.0,
    autoSuggestAI: true
  });

  // UI Drawer & Modal States
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(true);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Tabs State
  const [tabs, setTabs] = useState<TabSession[]>([
    {
      id: 'tab_1',
      title: 'PowerShell 5.1',
      mode: 'powershell',
      currentPath: 'C:\\Users\\Admin',
      history: [DEFAULT_BANNER_LINE],
      commandHistoryList: [],
      historyIndex: -1,
      environmentVars: { USERNAME: 'Admin', COMPUTERNAME: 'AI-STUDIO-WIN11' }
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Handler: Update current tab state
  const updateActiveTab = (updater: (prev: TabSession) => TabSession) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === activeTabId ? updater(t) : t))
    );
  };

  // Handler: Execute terminal command
  const handleExecuteInput = async (inputStr: string) => {
    const trimmed = inputStr.trim();
    if (!trimmed) return;

    // Append command prompt line to history
    const commandLine: TerminalLine = {
      id: crypto.randomUUID(),
      type: 'command',
      commandText: trimmed,
      mode: activeTab.mode,
      path: activeTab.currentPath,
      timestamp: new Date().toLocaleTimeString()
    };

    let updatedHistory = [...activeTab.history, commandLine];

    // Execute through command engine
    const result = await executeTerminalCommand(
      trimmed,
      activeTab.mode,
      activeTab.currentPath,
      vfs,
      activeTab.commandHistoryList
    );

    if (result.clearScreen) {
      updatedHistory = [];
    } else {
      updatedHistory = [...updatedHistory, ...result.lines];
    }

    const newCommandList = [...activeTab.commandHistoryList, trimmed];

    updateActiveTab((prev) => ({
      ...prev,
      history: updatedHistory,
      commandHistoryList: newCommandList,
      historyIndex: -1,
      currentPath: result.newCwd || prev.currentPath
    }));

    // Trigger AI Translation & Auto Execution Endpoint if required
    if (result.triggerAI) {
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: result.triggerAI.prompt,
            mode: activeTab.mode,
            currentPath: activeTab.currentPath
          })
        });
        const aiData = await res.json();

        const aiLine: TerminalLine = {
          id: crypto.randomUUID(),
          type: 'ai_translation',
          timestamp: new Date().toLocaleTimeString(),
          aiDetails: {
            originalPrompt: result.triggerAI.prompt,
            translatedCommand: aiData.command,
            explanation: aiData.explanation,
            riskLevel: aiData.riskLevel,
            riskReason: aiData.riskReason,
            alternatives: aiData.alternatives
          }
        };

        // Add translation line
        updateActiveTab((prev) => ({
          ...prev,
          history: [...prev.history, aiLine]
        }));

        // If safe or warning, automatically execute command and synthesize response
        if (aiData.command) {
          setTimeout(async () => {
            const execRes = await executeTerminalCommand(
              aiData.command,
              activeTab.mode,
              activeTab.currentPath,
              vfs,
              activeTab.commandHistoryList
            );

            const autoCmdLine: TerminalLine = {
              id: crypto.randomUUID(),
              type: 'command',
              commandText: aiData.command,
              mode: activeTab.mode,
              path: activeTab.currentPath,
              timestamp: new Date().toLocaleTimeString()
            };

            const stdoutText = execRes.lines
              .map((l) => l.text || (l.tableData ? JSON.stringify(l.tableData.rows) : ''))
              .join('\n');

            // Synthesize final answer via AI
            const synthRes = await fetch('/api/ai/auto-ask', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: result.triggerAI?.prompt,
                mode: activeTab.mode,
                currentPath: activeTab.currentPath,
                commandOutput: stdoutText
              })
            });
            const synthData = await synthRes.json();

            const answerLine: TerminalLine = {
              id: crypto.randomUUID(),
              type: 'stdout',
              text: `\n✨ [AI Auto-Answer & Findings Summary]:\n${synthData.answer || 'Command executed successfully.'}\n`,
              timestamp: new Date().toLocaleTimeString()
            };

            updateActiveTab((prev) => ({
              ...prev,
              history: [...prev.history, autoCmdLine, ...execRes.lines, answerLine]
            }));
          }, 600);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handler: Explain Command with AI
  const handleExplainCommand = async (cmdStr: string) => {
    const loadingLine: TerminalLine = {
      id: crypto.randomUUID(),
      type: 'system',
      text: `🤖 Analyzing command "${cmdStr}" with Gemini AI...`,
      timestamp: new Date().toLocaleTimeString()
    };

    updateActiveTab((prev) => ({
      ...prev,
      history: [...prev.history, loadingLine]
    }));

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdStr,
          mode: activeTab.mode,
          output: ''
        })
      });
      const data = await res.json();

      const explanationLine: TerminalLine = {
        id: crypto.randomUUID(),
        type: 'stdout',
        text: `\n--- 💡 Gemini AI Command Analysis ---\n${data.explanation}\n---------------------------------------\n`,
        timestamp: new Date().toLocaleTimeString()
      };

      updateActiveTab((prev) => ({
        ...prev,
        history: [...prev.history, explanationLine]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Tab Actions
  const handleNewTab = (mode: TerminalMode = 'powershell') => {
    const newTabId = `tab_${Date.now()}`;
    const newTitle =
      mode === 'cmd'
        ? 'CMD Prompt'
        : mode === 'pwsh7'
        ? 'PowerShell 7'
        : 'PowerShell 5.1';

    const banner: TerminalLine = {
      id: crypto.randomUUID(),
      type: 'stdout',
      text:
        mode === 'cmd'
          ? `Microsoft Windows [Version 10.0.22631.3593]\n(c) Microsoft Corporation. All rights reserved.\n`
          : `PowerShell 7.4.2\nhttps://aka.ms/powershell\nType "ai <prompt>" for AI translation.\n`,
      timestamp: new Date().toLocaleTimeString()
    };

    const newTab: TabSession = {
      id: newTabId,
      title: newTitle,
      mode,
      currentPath: 'C:\\Users\\Admin',
      history: [banner],
      commandHistoryList: [],
      historyIndex: -1,
      environmentVars: { USERNAME: 'Admin' }
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);

    // Auto set theme when switching to CMD
    if (mode === 'cmd' && settings.theme === 'powershell') {
      setSettings((s) => ({ ...s, theme: 'cmd' }));
    }
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
    }
  };

  // Handler: Save script content to VFS
  const handleSaveScriptToVFS = (path: string, content: string) => {
    createFile(vfs, path, content);
    setVfs({ ...vfs });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden font-sans">
      {/* Windows Window Header & Tabs */}
      <TerminalHeader
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={(id) => setActiveTabId(id)}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        onToggleExplorer={() => setIsExplorerOpen(true)}
        onToggleScriptEditor={() => setIsScriptEditorOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(true)}
        onClearTerminal={() =>
          updateActiveTab((prev) => ({ ...prev, history: [] }))
        }
        isCopilotOpen={isCopilotOpen}
      />

      {/* Main Terminal Viewport + Copilot Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <TerminalWindow
          mode={activeTab.mode}
          currentPath={activeTab.currentPath}
          history={activeTab.history}
          commandHistoryList={activeTab.commandHistoryList}
          historyIndex={activeTab.historyIndex}
          settings={settings}
          onExecuteInput={handleExecuteInput}
          onExplainCommand={handleExplainCommand}
          onNavigateHistory={(dir) => {
            updateActiveTab((prev) => ({
              ...prev,
              historyIndex:
                dir === 'up'
                  ? prev.historyIndex + 1
                  : Math.max(-1, prev.historyIndex - 1)
            }));
          }}
        />

        {/* AI PowerShell Copilot Drawer Panel */}
        <CopilotPanel
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          activeMode={activeTab.mode}
          currentPath={activeTab.currentPath}
          onExecuteCommand={handleExecuteInput}
          onSaveScriptToVFS={handleSaveScriptToVFS}
        />
      </div>

      {/* Modals */}
      <FileExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        vfs={vfs}
        onRefreshVFS={() => setVfs({ ...vfs })}
        onRunScriptInTerminal={handleExecuteInput}
      />

      <ScriptEditorModal
        isOpen={isScriptEditorOpen}
        onClose={() => setIsScriptEditorOpen(false)}
        onRunScript={(filename) =>
          handleExecuteInput(`.\\Scripts\\${filename}`)
        }
        onSaveToVFS={handleSaveScriptToVFS}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
      />
    </div>
  );
}
