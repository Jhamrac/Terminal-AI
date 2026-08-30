import { FileNode } from '../types';

export const INITIAL_VFS: Record<string, FileNode> = {
  'C:': {
    name: 'C:',
    type: 'directory',
    lastModified: '2026-08-15 09:00:00',
    attributes: ['Directory'],
    children: {
      'Users': {
        name: 'Users',
        type: 'directory',
        lastModified: '2026-08-15 09:00:00',
        attributes: ['Directory'],
        children: {
          'Admin': {
            name: 'Admin',
            type: 'directory',
            lastModified: '2026-08-29 10:15:00',
            attributes: ['Directory'],
            children: {
              'Desktop': {
                name: 'Desktop',
                type: 'directory',
                lastModified: '2026-08-28 14:20:00',
                attributes: ['Directory'],
                children: {
                  'Server_Shortcut.lnk': {
                    name: 'Server_Shortcut.lnk',
                    type: 'file',
                    size: 1024,
                    lastModified: '2026-08-20 11:00:00',
                    attributes: ['Archive'],
                    extension: 'lnk',
                    content: 'Target: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                  },
                  'ReadMe.txt': {
                    name: 'ReadMe.txt',
                    type: 'file',
                    size: 340,
                    lastModified: '2026-08-29 08:00:00',
                    attributes: ['Archive'],
                    extension: 'txt',
                    content: `Welcome to AI Powered Windows PowerShell & Command Prompt Terminal!

Features:
1. Type natural language commands directly using "ai <prompt>" or "? <prompt>".
2. Type "help" or "Get-Help" to list supported commands.
3. Switch modes between PowerShell 5.1, PowerShell 7, and Command Prompt (CMD).
4. Run .ps1 scripts in C:\\Users\\Admin\\Scripts.
5. Use the Copilot side panel for AI script generation & diagnostics.
`
                  }
                }
              },
              'Documents': {
                name: 'Documents',
                type: 'directory',
                lastModified: '2026-08-29 11:00:00',
                attributes: ['Directory'],
                children: {
                  'SystemReport.txt': {
                    name: 'SystemReport.txt',
                    type: 'file',
                    size: 2048,
                    lastModified: '2026-08-29 09:30:00',
                    attributes: ['Archive'],
                    extension: 'txt',
                    content: `=====================================================
Windows PowerShell System Report - Node-AI Terminal
Generated: 2026-08-29 09:30:00
=====================================================
Host Name:            AI-STUDIO-WIN11
OS Name:              Microsoft Windows 11 Enterprise
OS Version:           10.0.22631 N/A Build 22631
System Manufacturer:  Google AI Cloud Compute
System Model:         Virtual Workstation x64
System Type:          x64-based PC
Processor(s):         1 Processor(s) Installed. [01]: AMD EPYC 7B12 16-Core Processor
Total Physical Memory:16,384 MB
Available Memory:     11,840 MB
Virtual Memory Max:   24,576 MB
Virtual Memory Avail: 18,200 MB
PowerShell Version:   7.4.2 / Desktop 5.1.22621
ExecutionPolicy:      RemoteSigned
`
                  },
                  'Network_Config.json': {
                    name: 'Network_Config.json',
                    type: 'file',
                    size: 850,
                    lastModified: '2026-08-27 16:45:00',
                    attributes: ['Archive'],
                    extension: 'json',
                    content: JSON.stringify({
                      domain: 'CORP.INTERNAL',
                      ipAddress: '192.168.1.105',
                      subnetMask: '255.255.255.0',
                      gateway: '192.168.1.1',
                      dnsServers: ['1.1.1.1', '8.8.8.8'],
                      activeInterfaces: [
                        { name: 'Ethernet0', speed: '1 Gbps', status: 'Connected' },
                        { name: 'vEthernet (WSL)', speed: '10 Gbps', status: 'Connected' }
                      ]
                    }, null, 2)
                  }
                }
              },
              'Downloads': {
                name: 'Downloads',
                type: 'directory',
                lastModified: '2026-08-28 18:10:00',
                attributes: ['Directory'],
                children: {
                  'PowerShell-7.4.2-win-x64.msi': {
                    name: 'PowerShell-7.4.2-win-x64.msi',
                    type: 'file',
                    size: 104857602,
                    lastModified: '2026-08-28 18:10:00',
                    attributes: ['Archive'],
                    extension: 'msi',
                    content: '[Binary MSI Package Payload]'
                  }
                }
              },
              'Projects': {
                name: 'Projects',
                type: 'directory',
                lastModified: '2026-08-29 12:00:00',
                attributes: ['Directory'],
                children: {
                  'ServerMonitor': {
                    name: 'ServerMonitor',
                    type: 'directory',
                    lastModified: '2026-08-29 12:00:00',
                    attributes: ['Directory'],
                    children: {
                      'app.ps1': {
                        name: 'app.ps1',
                        type: 'file',
                        size: 1420,
                        lastModified: '2026-08-29 12:00:00',
                        attributes: ['Archive'],
                        extension: 'ps1',
                        content: `# Server Monitoring Script
param (
    [string]$ServerName = "localhost",
    [int]$IntervalSeconds = 5
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " Starting Server Monitor for $ServerName" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan

$cpu = Get-Random -Minimum 5 -Maximum 45
$mem = Get-Random -Minimum 30 -Maximum 75

Write-Host "[CPU Usage]: $cpu%" -ForegroundColor Yellow
Write-Host "[RAM Usage]: $mem%" -ForegroundColor Yellow
Write-Host "Status: Healthy" -ForegroundColor Green
`
                      },
                      'package.json': {
                        name: 'package.json',
                        type: 'file',
                        size: 450,
                        lastModified: '2026-08-29 11:30:00',
                        attributes: ['Archive'],
                        extension: 'json',
                        content: `{\n  "name": "server-monitor",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "powershell -File ./app.ps1"\n  }\n}`
                      }
                    }
                  }
                }
              },
              'Scripts': {
                name: 'Scripts',
                type: 'directory',
                lastModified: '2026-08-29 10:00:00',
                attributes: ['Directory'],
                children: {
                  'Backup.ps1': {
                    name: 'Backup.ps1',
                    type: 'file',
                    size: 890,
                    lastModified: '2026-08-25 14:00:00',
                    attributes: ['Archive'],
                    extension: 'ps1',
                    content: `# Automatic Documents Backup Script
$source = "C:\\Users\\Admin\\Documents"
$destination = "C:\\Backups\\Docs_" + (Get-Date -Format "yyyyMMdd_HHmmss")

Write-Host "Backing up documents from $source to $destination..." -ForegroundColor Green
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Copy-Item -Path "$source\\*" -Destination $destination -Recurse -Force
Write-Host "Backup completed successfully!" -ForegroundColor Cyan
`
                  },
                  'CleanupTemp.bat': {
                    name: 'CleanupTemp.bat',
                    type: 'file',
                    size: 320,
                    lastModified: '2026-08-22 09:12:00',
                    attributes: ['Archive'],
                    extension: 'bat',
                    content: `@echo off
echo Cleaning temporary files...
del /q /f C:\\Windows\\Temp\\*
echo Temp files cleaned successfully!
`
                  }
                }
              }
            }
          }
        }
      },
      'Windows': {
        name: 'Windows',
        type: 'directory',
        lastModified: '2026-08-01 00:00:00',
        attributes: ['Directory', 'System'],
        children: {
          'System32': {
            name: 'System32',
            type: 'directory',
            lastModified: '2026-08-01 00:00:00',
            attributes: ['Directory', 'System'],
            children: {
              'cmd.exe': {
                name: 'cmd.exe',
                type: 'file',
                size: 289792,
                lastModified: '2026-08-01 00:00:00',
                attributes: ['System', 'ReadOnly'],
                extension: 'exe',
                content: '[Microsoft Windows Command Processor Binary]'
              },
              'drivers': {
                name: 'drivers',
                type: 'directory',
                lastModified: '2026-08-01 00:00:00',
                attributes: ['Directory', 'System'],
                children: {
                  'etc': {
                    name: 'etc',
                    type: 'directory',
                    lastModified: '2026-08-01 00:00:00',
                    attributes: ['Directory'],
                    children: {
                      'hosts': {
                        name: 'hosts',
                        type: 'file',
                        size: 824,
                        lastModified: '2026-08-10 12:00:00',
                        attributes: ['Archive'],
                        extension: '',
                        content: `# Copyright (c) 1993-2026 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
127.0.0.1       localhost
::1             localhost
127.0.0.1       dev.internal.local
`
                      }
                    }
                  }
                }
              }
            }
          },
          'Logs': {
            name: 'Logs',
            type: 'directory',
            lastModified: '2026-08-29 08:00:00',
            attributes: ['Directory'],
            children: {
              'CBS.log': {
                name: 'CBS.log',
                type: 'file',
                size: 14500,
                lastModified: '2026-08-29 08:00:00',
                attributes: ['Archive'],
                extension: 'log',
                content: `2026-08-29 08:00:01, Info                  CBS    Initializing CBS engine
2026-08-29 08:00:02, Info                  CBS    Loaded servicing stack version 10.0.22621.3500
2026-08-29 08:00:05, Info                  CBS    Package_for_KB5037771~31bf3856ad364e35~amd64~~10.0.1.2 state: Installed
2026-08-29 08:00:10, Info                  CBS    System integrity check: 100% verified complete.
`
              }
            }
          }
        }
      },
      'Program Files': {
        name: 'Program Files',
        type: 'directory',
        lastModified: '2026-08-01 00:00:00',
        attributes: ['Directory'],
        children: {
          'PowerShell': {
            name: 'PowerShell',
            type: 'directory',
            lastModified: '2026-08-15 00:00:00',
            attributes: ['Directory'],
            children: {
              '7': {
                name: '7',
                type: 'directory',
                lastModified: '2026-08-15 00:00:00',
                attributes: ['Directory'],
                children: {
                  'pwsh.exe': {
                    name: 'pwsh.exe',
                    type: 'file',
                    size: 450000,
                    lastModified: '2026-08-15 00:00:00',
                    attributes: ['Archive'],
                    extension: 'exe',
                    content: '[PowerShell 7 Core Binary Executable]'
                  }
                }
              }
            }
          }
        }
      },
      'Backups': {
        name: 'Backups',
        type: 'directory',
        lastModified: '2026-08-25 14:00:00',
        attributes: ['Directory'],
        children: {}
      }
    }
  }
};

// VFS Helper Functions
export function normalizePath(rawPath: string, currentCwd: string = 'C:\\Users\\Admin'): string {
  let cleaned = rawPath.trim().replace(/\//g, '\\');

  // Handle ~ shortcut to user home
  if (cleaned.startsWith('~')) {
    cleaned = cleaned.replace('~', 'C:\\Users\\Admin');
  }

  // Handle absolute drive paths
  if (/^[a-zA-Z]:/.test(cleaned)) {
    // Has drive letter
  } else {
    // Relative path
    if (cleaned === '.') return currentCwd;
    if (cleaned === '..') {
      const parts = currentCwd.split('\\').filter(Boolean);
      if (parts.length > 1) {
        parts.pop();
        return parts.join('\\');
      }
      return 'C:';
    }
    
    cleaned = `${currentCwd}\\${cleaned}`;
  }

  // Split and collapse relative segments
  const segments = cleaned.split('\\').filter(Boolean);
  const stack: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === '.') continue;
    if (seg === '..') {
      if (stack.length > 1) {
        stack.pop();
      }
    } else {
      stack.push(seg);
    }
  }

  if (stack.length === 0) return 'C:';
  if (stack.length === 1 && stack[0].endsWith(':')) return stack[0];
  
  // Format standard C:\Users\Admin
  const drive = stack[0].toUpperCase();
  const rest = stack.slice(1).join('\\');
  return rest ? `${drive}\\${rest}` : drive;
}

export function getNodeAtPath(vfs: Record<string, FileNode>, absolutePath: string): FileNode | null {
  const norm = normalizePath(absolutePath);
  const segments = norm.split('\\').filter(Boolean);

  if (segments.length === 0) return null;

  const driveKey = segments[0].toUpperCase();
  let current: FileNode | undefined = vfs[driveKey];

  if (!current) return null;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (current.type !== 'directory' || !current.children) return null;
    
    // Case-insensitive segment lookup
    const foundKey = Object.keys(current.children).find(
      k => k.toLowerCase() === seg.toLowerCase()
    );

    if (!foundKey) return null;
    current = current.children[foundKey];
  }

  return current || null;
}

export function createDirectory(vfs: Record<string, FileNode>, targetPath: string): { success: boolean; error?: string } {
  const norm = normalizePath(targetPath);
  const parts = norm.split('\\').filter(Boolean);
  if (parts.length <= 1) return { success: false, error: 'Cannot create root drive directory' };

  const dirName = parts[parts.length - 1];
  const parentPath = parts.slice(0, -1).join('\\');

  const parentNode = getNodeAtPath(vfs, parentPath);
  if (!parentNode) return { success: false, error: `Directory '${parentPath}' not found.` };
  if (parentNode.type !== 'directory') return { success: false, error: `'${parentPath}' is not a directory.` };

  if (!parentNode.children) parentNode.children = {};

  // Check if exists
  const existingKey = Object.keys(parentNode.children).find(k => k.toLowerCase() === dirName.toLowerCase());
  if (existingKey) {
    return { success: false, error: `Directory or file '${dirName}' already exists.` };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  parentNode.children[dirName] = {
    name: dirName,
    type: 'directory',
    lastModified: now,
    attributes: ['Directory'],
    children: {}
  };

  return { success: true };
}

export function createFile(vfs: Record<string, FileNode>, filePath: string, content: string = ''): { success: boolean; error?: string } {
  const norm = normalizePath(filePath);
  const parts = norm.split('\\').filter(Boolean);
  if (parts.length <= 1) return { success: false, error: 'Invalid file path' };

  const fileName = parts[parts.length - 1];
  const parentPath = parts.slice(0, -1).join('\\');

  const parentNode = getNodeAtPath(vfs, parentPath);
  if (!parentNode) return { success: false, error: `Directory '${parentPath}' does not exist.` };
  if (parentNode.type !== 'directory') return { success: false, error: `'${parentPath}' is not a directory.` };

  if (!parentNode.children) parentNode.children = {};

  const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Case insensitive check
  const existingKey = Object.keys(parentNode.children).find(k => k.toLowerCase() === fileName.toLowerCase());
  const targetKey = existingKey || fileName;

  parentNode.children[targetKey] = {
    name: targetKey,
    type: 'file',
    content,
    size: new Blob([content]).size,
    lastModified: now,
    attributes: ['Archive'],
    extension: ext
  };

  return { success: true };
}

export function deleteNode(vfs: Record<string, FileNode>, targetPath: string): { success: boolean; error?: string } {
  const norm = normalizePath(targetPath);
  const parts = norm.split('\\').filter(Boolean);
  if (parts.length <= 1) return { success: false, error: 'Cannot delete root drive' };

  const nodeName = parts[parts.length - 1];
  const parentPath = parts.slice(0, -1).join('\\');

  const parentNode = getNodeAtPath(vfs, parentPath);
  if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
    return { success: false, error: `Path '${targetPath}' not found.` };
  }

  const existingKey = Object.keys(parentNode.children).find(k => k.toLowerCase() === nodeName.toLowerCase());
  if (!existingKey) return { success: false, error: `Cannot find path '${targetPath}' because it does not exist.` };

  delete parentNode.children[existingKey];
  return { success: true };
}
