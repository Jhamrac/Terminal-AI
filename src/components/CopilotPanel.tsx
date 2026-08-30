import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Play,
  Copy,
  Check,
  Code,
  Terminal,
  BookOpen,
  Wrench,
  X,
  AlertTriangle,
  FileCode,
  Save,
  MessageSquare,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { CopilotMessage, TerminalMode } from '../types';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: TerminalMode;
  currentPath: string;
  onExecuteCommand: (cmd: string) => void;
  onSaveScriptToVFS: (filename: string, content: string) => void;
}

const CMDLET_CHEATSHEET = [
  {
    category: 'BACnet & Building Automation (BAS/BMS)',
    items: [
      { cmd: 'Discover-BACnetDevices', desc: 'Broadcast BACnet Who-Is (UDP 47808) & discover controllers' },
      { cmd: 'Test-BACnetWhoIs -Subnet 10.10.40.255', desc: 'Targeted BACnet Who-Is scan' },
      { cmd: 'Get-BACnetObjects -DeviceID 1001', desc: 'Read BACnet objects & analog values' }
    ]
  },
  {
    category: 'Tridium Niagara & Fox Protocol',
    items: [
      { cmd: 'Test-FoxPort 10.10.40.100', desc: 'Test TCP 1911 (Fox) & TCP 4911 (Foxs TLS)' },
      { cmd: 'Get-NiagaraStationStatus 10.10.40.100', desc: 'Query Niagara JACE/station status and NRE version' }
    ]
  },
  {
    category: 'Networking & IP Subnets',
    items: [
      { cmd: 'Test-IPNetwork 10.10.40.0/24', desc: 'Scan active hosts on subnet' },
      { cmd: 'Get-NetIPAddress -AddressFamily IPv4', desc: 'Get IPv4 network interfaces' },
      { cmd: 'Test-Connection -ComputerName 8.8.8.8 -Count 4', desc: 'Ping remote host with statistics' }
    ]
  },
  {
    category: 'Process & Services',
    items: [
      { cmd: 'Get-Process | Where-Object CPU -gt 10 | Sort-Object CPU -Descending', desc: 'Top CPU consumer processes' },
      { cmd: 'Get-Service | Where-Object Status -eq "Running"', desc: 'List all running services' }
    ]
  }
];

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  activeMode,
  currentPath,
  onExecuteCommand,
  onSaveScriptToVFS
}) => {
  const [activeTab, setActiveTab] = useState<'translate' | 'architect' | 'cheatsheet' | 'chat'>('translate');
  
  // Natural Language Command Generator State
  const [prompt, setPrompt] = useState('');
  const [isLoadingTranslate, setIsLoadingTranslate] = useState(false);
  const [translatedData, setTranslatedData] = useState<{
    command: string;
    explanation: string;
    riskLevel: 'safe' | 'warning' | 'dangerous';
    riskReason?: string;
    alternatives?: string[];
  } | null>(null);

  // Script Generator State
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [scriptType, setScriptType] = useState<'ps1' | 'bat'>('ps1');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<{
    filename: string;
    code: string;
    summary: string;
    usageInstructions: string;
  } | null>(null);
  const [scriptSavedMessage, setScriptSavedMessage] = useState(false);

  // Copilot Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am your AI PowerShell & Windows SysAdmin Copilot. Ask me how to automate tasks, fix terminal errors, or generate complex scripts.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler: Natural Language to Command
  const handleTranslate = async () => {
    if (!prompt.trim()) return;
    setIsLoadingTranslate(true);
    setTranslatedData(null);

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: activeMode, currentPath })
      });
      const data = await res.json();
      setTranslatedData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTranslate(false);
    }
  };

  // Handler: Script Architect Generator
  const handleGenerateScript = async () => {
    if (!scriptPrompt.trim()) return;
    setIsGeneratingScript(true);
    setGeneratedScript(null);
    setScriptSavedMessage(false);

    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: scriptPrompt, scriptType })
      });
      const data = await res.json();
      setGeneratedScript(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handler: Save Generated Script to VFS
  const handleSaveScript = () => {
    if (!generatedScript) return;
    const savePath = `C:\\Users\\Admin\\Scripts\\${generatedScript.filename}`;
    onSaveScriptToVFS(savePath, generatedScript.code);
    setScriptSavedMessage(true);
    setTimeout(() => setScriptSavedMessage(false), 3000);
  };

  // Handler: Chat submit
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          mode: activeMode,
          context: { currentPath }
        })
      });
      const data = await res.json();
      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages([...newHistory, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(id);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="w-80 sm:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full z-40 text-neutral-200 select-none shadow-2xl shrink-0">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-950/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-tight text-white">AI PowerShell Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-900/90 text-xs font-medium">
        <button
          onClick={() => setActiveTab('translate')}
          className={`flex-1 py-2 px-1 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'translate'
              ? 'border-blue-500 text-blue-400 font-semibold bg-blue-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Prompt</span>
        </button>
        <button
          onClick={() => setActiveTab('architect')}
          className={`flex-1 py-2 px-1 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'architect'
              ? 'border-blue-500 text-blue-400 font-semibold bg-blue-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Script</span>
        </button>
        <button
          onClick={() => setActiveTab('cheatsheet')}
          className={`flex-1 py-2 px-1 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'cheatsheet'
              ? 'border-blue-500 text-blue-400 font-semibold bg-blue-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Cmdlets</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-1 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'chat'
              ? 'border-blue-500 text-blue-400 font-semibold bg-blue-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {/* 1. NATURAL LANGUAGE PROMPT TAB */}
        {activeTab === 'translate' && (
          <div className="space-y-3">
            <div className="bg-neutral-850 p-2.5 rounded-lg border border-neutral-800 text-neutral-300 space-y-1">
              <span className="font-semibold text-blue-300 block">Natural Language Command Generator</span>
              <p className="text-[11px] text-neutral-400">
                Describe in English what you want to achieve in {activeMode.toUpperCase()}.
              </p>
            </div>

            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Find all processes using more than 50MB memory and sort by CPU usage..."
                rows={3}
                className="w-full bg-black/60 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
              />
              <button
                onClick={handleTranslate}
                disabled={isLoadingTranslate || !prompt.trim()}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
              >
                {isLoadingTranslate ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Command</span>
                  </>
                )}
              </button>
            </div>

            {translatedData && (
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="font-semibold text-emerald-400 text-[11px]">Generated Code</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      translatedData.riskLevel === 'dangerous'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : translatedData.riskLevel === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {translatedData.riskLevel}
                  </span>
                </div>

                <div className="bg-black/80 p-2 rounded border border-neutral-800 font-mono text-cyan-300 break-all select-all">
                  {translatedData.command}
                </div>

                <p className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-900 p-2 rounded">
                  {translatedData.explanation}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopyCode(translatedData.command, 'translate')}
                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded font-medium flex items-center justify-center gap-1.5"
                  >
                    {copiedCodeIndex === 'translate' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => onExecuteCommand(translatedData.command)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SCRIPT ARCHITECT TAB */}
        {activeTab === 'architect' && (
          <div className="space-y-3">
            <div className="bg-neutral-850 p-2.5 rounded-lg border border-neutral-800">
              <span className="font-semibold text-emerald-300 block">AI PowerShell Script Architect</span>
              <p className="text-[11px] text-neutral-400">
                Generate production .ps1 or .bat scripts with parameters & try/catch blocks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScriptType('ps1')}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  scriptType === 'ps1'
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                PowerShell (.ps1)
              </button>
              <button
                onClick={() => setScriptType('bat')}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  scriptType === 'bat'
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                Batch (.bat)
              </button>
            </div>

            <div>
              <textarea
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
                placeholder="e.g. Create a daily backup script that compresses Documents folder to C:\Backups with timestamp..."
                rows={3}
                className="w-full bg-black/60 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
              />
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || !scriptPrompt.trim()}
                className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
              >
                {isGeneratingScript ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Architect Script</span>
                  </>
                )}
              </button>
            </div>

            {generatedScript && (
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                  <span className="font-mono text-emerald-400 font-semibold">{generatedScript.filename}</span>
                  {scriptSavedMessage && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Saved to VFS!
                    </span>
                  )}
                </div>

                <div className="bg-black/90 p-2.5 rounded border border-neutral-800 max-h-48 overflow-y-auto font-mono text-[11px] text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {generatedScript.code}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveScript}
                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded font-medium flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save to C:\Scripts</span>
                  </button>
                  <button
                    onClick={() => onExecuteCommand(`.\\Scripts\\${generatedScript.filename}`)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Script</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CMDLET CHEATSHEET TAB */}
        {activeTab === 'cheatsheet' && (
          <div className="space-y-4">
            {CMDLET_CHEATSHEET.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <span className="font-semibold text-blue-300 text-xs block border-b border-neutral-800 pb-1">
                  {cat.category}
                </span>
                <div className="space-y-1.5">
                  {cat.items.map((item, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-2 bg-neutral-950 hover:bg-neutral-850 rounded border border-neutral-800 transition-colors group cursor-pointer"
                      onClick={() => onExecuteCommand(item.cmd)}
                    >
                      <div className="flex items-center justify-between text-cyan-300 font-mono text-[11px] break-all">
                        <span>{item.cmd}</span>
                        <Play className="w-3 h-3 text-neutral-500 group-hover:text-blue-400 shrink-0 ml-1" />
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. COPILOT CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-900/40 text-blue-100 ml-4 border border-blue-700/50'
                      : 'bg-neutral-850 text-neutral-200 mr-2 border border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 font-mono">
                    <span>{msg.role === 'user' ? 'You' : 'PS-Copilot'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>
              ))}
              {isChatLoading && (
                <div className="p-2.5 bg-neutral-850 text-neutral-400 text-xs rounded-lg flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask PS-Copilot..."
                className="flex-1 bg-black/60 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 text-white rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
