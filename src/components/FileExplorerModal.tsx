import React, { useState } from 'react';
import {
  FolderTree,
  X,
  Folder,
  FileText,
  FileCode,
  FolderPlus,
  FilePlus,
  Trash2,
  Save,
  ChevronRight,
  ChevronDown,
  HardDrive
} from 'lucide-react';
import { FileNode } from '../types';
import { createFile, createDirectory, deleteNode, getNodeAtPath } from '../lib/virtualFileSystem';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vfs: Record<string, FileNode>;
  onRefreshVFS: () => void;
  onRunScriptInTerminal: (path: string) => void;
}

export const FileExplorerModal: React.FC<FileExplorerModalProps> = ({
  isOpen,
  onClose,
  vfs,
  onRefreshVFS,
  onRunScriptInTerminal
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('C:\\Users\\Admin\\Documents');
  const [editingContent, setEditingContent] = useState<string>('');
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'file' | 'dir'>('file');

  if (!isOpen) return null;

  const handleSelectNode = (path: string) => {
    setSelectedPath(path);
    const node = getNodeAtPath(vfs, path);
    if (node && node.type === 'file') {
      setActiveFile(node);
      setEditingContent(node.content || '');
    } else {
      setActiveFile(null);
    }
  };

  const handleSaveFile = () => {
    if (!activeFile) return;
    createFile(vfs, selectedPath, editingContent);
    onRefreshVFS();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteItem = () => {
    if (!selectedPath || selectedPath === 'C:') return;
    deleteNode(vfs, selectedPath);
    onRefreshVFS();
    setSelectedPath('C:\\Users\\Admin');
    setActiveFile(null);
  };

  const handleCreateNew = () => {
    if (!newItemName.trim()) return;
    const currentDirectoryPath = activeFile
      ? selectedPath.substring(0, selectedPath.lastIndexOf('\\'))
      : selectedPath;

    const fullNewPath = `${currentDirectoryPath}\\${newItemName.trim()}`;
    if (newItemType === 'file') {
      createFile(vfs, fullNewPath, '# New Script or File\n');
    } else {
      createDirectory(vfs, fullNewPath);
    }

    setNewItemName('');
    onRefreshVFS();
  };

  const selectedNode = getNodeAtPath(vfs, selectedPath);

  // Render tree recursively
  const renderTreeNodes = (node: FileNode, currentPath: string) => {
    if (node.type !== 'directory' || !node.children) return null;

    return (
      <div className="pl-3 space-y-0.5">
        {Object.keys(node.children).map((key) => {
          const child = node.children![key];
          const childPath = `${currentPath}\\${child.name}`;
          const isSelected = selectedPath === childPath;

          if (child.type === 'directory') {
            return (
              <div key={childPath}>
                <div
                  onClick={() => handleSelectNode(childPath)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer font-mono ${
                    isSelected ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{child.name}</span>
                </div>
                {renderTreeNodes(child, childPath)}
              </div>
            );
          } else {
            const isScript = child.name.endsWith('.ps1') || child.name.endsWith('.bat');
            return (
              <div
                key={childPath}
                onClick={() => handleSelectNode(childPath)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer font-mono pl-5 ${
                  isSelected ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                {isScript ? (
                  <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <span className="truncate">{child.name}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col text-neutral-200 overflow-hidden select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-sm text-white">Virtual File System (C:\)</span>
            <span className="text-xs text-neutral-400 font-mono bg-neutral-850 px-2 py-0.5 rounded border border-neutral-800">
              {selectedPath}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Tree Navigator */}
          <div className="w-64 border-r border-neutral-800 bg-neutral-950/60 p-3 overflow-y-auto font-mono text-xs space-y-2">
            <div
              onClick={() => handleSelectNode('C:')}
              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${
                selectedPath === 'C:' ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <HardDrive className="w-4 h-4 text-blue-400 shrink-0" />
              <span>C: (System Drive)</span>
            </div>

            {vfs['C:'] && renderTreeNodes(vfs['C:'], 'C:')}
          </div>

          {/* Right Editor & Inspector */}
          <div className="flex-1 flex flex-col p-4 bg-neutral-900/90 overflow-hidden">
            {activeFile ? (
              <div className="flex-1 flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm font-semibold text-white">{activeFile.name}</span>
                    <span className="text-xs text-neutral-400">({activeFile.size || 0} bytes)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(activeFile.name.endsWith('.ps1') || activeFile.name.endsWith('.bat')) && (
                      <button
                        onClick={() => {
                          onRunScriptInTerminal(`.\\${selectedPath.replace('C:\\Users\\Admin\\', '')}`);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                      >
                        Run in Terminal
                      </button>
                    )}
                    <button
                      onClick={handleSaveFile}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleDeleteItem}
                      className="p-1 hover:bg-red-950 text-neutral-400 hover:text-red-400 rounded transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {savedSuccess && (
                  <div className="text-xs text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-800">
                    File saved successfully!
                  </div>
                )}

                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="flex-1 bg-black/80 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-emerald-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="font-semibold text-sm text-white block border-b border-neutral-800 pb-2">
                    Directory Content: {selectedPath}
                  </span>

                  {selectedNode && selectedNode.type === 'directory' && selectedNode.children ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.values(selectedNode.children).map((item, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectNode(`${selectedPath}\\${item.name}`)}
                          className="p-2.5 bg-neutral-950 hover:bg-neutral-800 rounded border border-neutral-800 flex items-center gap-2 cursor-pointer font-mono text-xs transition-colors"
                        >
                          {item.type === 'directory' ? (
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                          )}
                          <span className="truncate text-neutral-200">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-xs italic">Folder is empty.</p>
                  )}
                </div>

                {/* Create New File/Folder Section */}
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                  <span className="text-xs font-semibold text-neutral-300 block">Create Item in {selectedPath}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                      className="bg-black/60 border border-neutral-700 text-xs rounded px-2 py-1 text-neutral-200 focus:outline-none"
                    >
                      <option value="file">File (.ps1, .txt, .json)</option>
                      <option value="dir">Folder</option>
                    </select>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={newItemType === 'file' ? 'e.g. MyScript.ps1' : 'e.g. NewFolder'}
                      className="flex-1 bg-black/60 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleCreateNew}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
