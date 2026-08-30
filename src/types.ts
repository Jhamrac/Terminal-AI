export type TerminalMode = 'powershell' | 'cmd' | 'pwsh7';

export type TerminalTheme =
  | 'powershell' // Classic PowerShell Blue
  | 'cmd'        // Classic CMD Black & Green/White
  | 'dracula'    // Dark Purple & Pink accents
  | 'matrix'     // Black & Neon Green Matrix
  | 'retro_amber'// Amber Monospaced Retro CRT
  | 'cyberpunk'; // Deep Blue / Cyan / Magenta

export type OutputType =
  | 'command'
  | 'stdout'
  | 'stderr'
  | 'warning'
  | 'system'
  | 'ai_translation'
  | 'ai_explanation'
  | 'ai_fix'
  | 'script_code'
  | 'table';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface TerminalLine {
  id: string;
  type: OutputType;
  text?: string;
  commandText?: string;
  mode?: TerminalMode;
  path?: string;
  timestamp: string;
  tableData?: {
    columns: TableColumn[];
    rows: Record<string, any>[];
  };
  aiDetails?: {
    originalPrompt?: string;
    translatedCommand?: string;
    explanation?: string;
    riskLevel?: 'safe' | 'warning' | 'dangerous';
    riskReason?: string;
    alternatives?: string[];
    rootCause?: string;
    suggestedFixCommand?: string;
  };
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number; // bytes
  lastModified: string;
  attributes?: string[]; // e.g. ['Archive'], ['Directory']
  children?: Record<string, FileNode>;
  extension?: string;
}

export interface TabSession {
  id: string;
  title: string;
  mode: TerminalMode;
  currentPath: string;
  history: TerminalLine[];
  commandHistoryList: string[];
  historyIndex: number;
  environmentVars: Record<string, string>;
}

export interface TerminalSettings {
  theme: TerminalTheme;
  fontSize: number; // e.g. 14
  fontFamily: string; // 'Consolas', 'Cascadia Code', 'Courier New', monospace
  soundEffects: boolean;
  scanlines: boolean;
  blinkingCursor: boolean;
  cursorStyle: 'block' | 'underline' | 'beam';
  windowOpacity: number; // 0.8 - 1.0
  autoSuggestAI: boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeSnippet?: {
    language: 'powershell' | 'batch' | 'text';
    code: string;
  };
}

export interface SavedScript {
  id: string;
  filename: string;
  path: string;
  content: string;
  language: 'ps1' | 'bat';
  createdAt: string;
  lastExecutedAt?: string;
}
