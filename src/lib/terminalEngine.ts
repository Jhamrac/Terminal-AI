import { FileNode, TerminalLine, TerminalMode } from '../types';
import {
  createDirectory,
  createFile,
  deleteNode,
  getNodeAtPath,
  normalizePath
} from './virtualFileSystem';

export interface ProcessItem {
  id: number;
  name: string;
  cpu: number;
  workingSetMB: number;
  status: string;
}

export interface ServiceItem {
  name: string;
  displayName: string;
  status: 'Running' | 'Stopped';
  startType: 'Automatic' | 'Manual' | 'Disabled';
}

const MOCK_PROCESSES: ProcessItem[] = [
  { id: 4, name: 'System', cpu: 1.2, workingSetMB: 128, status: 'Running' },
  { id: 412, name: 'explorer.exe', cpu: 3.4, workingSetMB: 312, status: 'Running' },
  { id: 1040, name: 'powershell.exe', cpu: 2.1, workingSetMB: 185, status: 'Running' },
  { id: 2150, name: 'pwsh.exe', cpu: 1.8, workingSetMB: 210, status: 'Running' },
  { id: 3820, name: 'chrome.exe', cpu: 8.5, workingSetMB: 840, status: 'Running' },
  { id: 4912, name: 'Code.exe', cpu: 4.2, workingSetMB: 520, status: 'Running' },
  { id: 5120, name: 'node.exe', cpu: 5.6, workingSetMB: 290, status: 'Running' },
  { id: 6200, name: 'MsMpEng.exe', cpu: 0.8, workingSetMB: 195, status: 'Running' },
  { id: 7410, name: 'spoolsv.exe', cpu: 0.1, workingSetMB: 45, status: 'Running' }
];

const MOCK_SERVICES: ServiceItem[] = [
  { name: 'WinDefend', displayName: 'Microsoft Defender Antivirus Service', status: 'Running', startType: 'Automatic' },
  { name: 'wuauserv', displayName: 'Windows Update', status: 'Running', startType: 'Automatic' },
  { name: 'EventLog', displayName: 'Windows Event Log', status: 'Running', startType: 'Automatic' },
  { name: 'Spooler', displayName: 'Print Spooler', status: 'Running', startType: 'Automatic' },
  { name: 'Dhcp', displayName: 'DHCP Client', status: 'Running', startType: 'Automatic' },
  { name: 'Dnscache', displayName: 'DNS Client', status: 'Running', startType: 'Automatic' },
  { name: 'SysMain', displayName: 'SysMain (Superfetch)', status: 'Stopped', startType: 'Manual' },
  { name: 'BITS', displayName: 'Background Intelligent Transfer Service', status: 'Stopped', startType: 'Manual' }
];

export interface ExecutionResult {
  lines: TerminalLine[];
  newCwd?: string;
  clearScreen?: boolean;
  triggerAI?: {
    type: 'translate' | 'explain' | 'diagnose';
    prompt?: string;
  };
}

export async function executeTerminalCommand(
  rawInput: string,
  mode: TerminalMode,
  currentCwd: string,
  vfs: Record<string, FileNode>,
  historyList: string[]
): Promise<ExecutionResult> {
  const trimmed = rawInput.trim();
  const timestamp = new Date().toLocaleTimeString();

  if (!trimmed) {
    return { lines: [] };
  }

  // Check for AI Prefix Trigger: "ai ...", "? ...", or "help me ..."
  if (trimmed.startsWith('ai ') || trimmed.startsWith('? ') || trimmed.toLowerCase().startsWith('ask ai ')) {
    let aiQuery = '';
    if (trimmed.startsWith('ai ')) aiQuery = trimmed.substring(3).trim();
    else if (trimmed.startsWith('? ')) aiQuery = trimmed.substring(2).trim();
    else aiQuery = trimmed.substring(7).trim();

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'system',
          text: `🤖 Consulting Gemini AI Assistant for: "${aiQuery}"...`,
          timestamp
        }
      ],
      triggerAI: {
        type: 'translate',
        prompt: aiQuery
      }
    };
  }

  // Tokenize command string
  const tokens = parseCommandLineArgs(trimmed);
  const cmd = tokens[0]?.toLowerCase() || '';
  const args = tokens.slice(1);

  // 1. CLEAR / CLS
  if (cmd === 'cls' || cmd === 'clear' || cmd === 'clear-host') {
    return { lines: [], clearScreen: true };
  }

  // 2. GET-LOCATION / PWD / GL
  if (cmd === 'pwd' || cmd === 'get-location' || cmd === 'gl') {
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: mode === 'cmd' ? 'stdout' : 'table',
          text: mode === 'cmd' ? currentCwd : undefined,
          tableData: mode !== 'cmd' ? {
            columns: [
              { key: 'path', label: 'Path', width: 'w-full' }
            ],
            rows: [{ path: currentCwd }]
          } : undefined,
          timestamp
        }
      ]
    };
  }

  // 3. SET-LOCATION / CD / CHDIR
  if (cmd === 'cd' || cmd === 'cd..' || cmd === 'chdir' || cmd === 'set-location' || cmd === 'sl') {
    let target = args[0] || '~';
    
    // CMD support for cd \ or cd..
    if (cmd === 'cd..' || target === '..') target = '..';
    if (target === '\\') target = 'C:';

    const resolved = normalizePath(target, currentCwd);
    const node = getNodeAtPath(vfs, resolved);

    if (!node) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `The system cannot find the path specified.`
              : `Set-Location : Cannot find path '${resolved}' because it does not exist.\nAt line:1 char:1\n+ cd ${target}\n+ ~~~~~~~~~~`,
            timestamp
          }
        ]
      };
    }

    if (node.type !== 'directory') {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `The directory name is invalid.`
              : `Set-Location : '${resolved}' is a file, not a directory.`,
            timestamp
          }
        ]
      };
    }

    return {
      lines: [],
      newCwd: resolved
    };
  }

  // 4. GET-CHILDITEM / DIR / LS / GCI
  if (cmd === 'dir' || cmd === 'ls' || cmd === 'get-childitem' || cmd === 'gci') {
    const targetPath = args.find(a => !a.startsWith('-')) || currentCwd;
    const resolved = normalizePath(targetPath, currentCwd);
    const node = getNodeAtPath(vfs, resolved);

    if (!node) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `File Not Found`
              : `Get-ChildItem : Cannot find path '${resolved}' because it does not exist.`,
            timestamp
          }
        ]
      };
    }

    if (node.type === 'file') {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'table',
            tableData: {
              columns: [
                { key: 'mode', label: 'Mode', width: 'w-24' },
                { key: 'lastWriteTime', label: 'LastWriteTime', width: 'w-48' },
                { key: 'length', label: 'Length', width: 'w-24' },
                { key: 'name', label: 'Name', width: 'w-auto' }
              ],
              rows: [
                {
                  mode: '-a---',
                  lastWriteTime: node.lastModified,
                  length: node.size || 0,
                  name: node.name
                }
              ]
            },
            timestamp
          }
        ]
      };
    }

    // List directory children
    const childrenObj = node.children || {};
    const items = Object.values(childrenObj);

    if (mode === 'cmd') {
      let output = ` Volume in drive C has no label.\n Volume Serial Number is A891-72EF\n\n Directory of ${resolved}\n\n`;
      let dirCount = 0;
      let fileCount = 0;
      let totalBytes = 0;

      items.forEach(item => {
        const dateStr = item.lastModified;
        if (item.type === 'directory') {
          output += `${dateStr}    <DIR>          ${item.name}\n`;
          dirCount++;
        } else {
          const sz = (item.size || 0).toString().padStart(14, ' ');
          output += `${dateStr}  ${sz} ${item.name}\n`;
          fileCount++;
          totalBytes += item.size || 0;
        }
      });

      output += `               ${fileCount} File(s)    ${totalBytes.toLocaleString()} bytes\n`;
      output += `               ${dirCount} Dir(s)  121,412,890,624 bytes free`;

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text: output,
            timestamp
          }
        ]
      };
    } else {
      // PowerShell table layout
      const rows = items.map(item => ({
        mode: item.type === 'directory' ? 'd----' : '-a---',
        lastWriteTime: item.lastModified,
        length: item.type === 'directory' ? '' : (item.size || 0),
        name: item.name,
        type: item.type
      }));

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text: `\n    Directory: ${resolved}\n`,
            timestamp
          },
          {
            id: crypto.randomUUID(),
            type: 'table',
            tableData: {
              columns: [
                { key: 'mode', label: 'Mode', width: 'w-20' },
                { key: 'lastWriteTime', label: 'LastWriteTime', width: 'w-44' },
                { key: 'length', label: 'Length (B)', width: 'w-28' },
                { key: 'name', label: 'Name', width: 'w-auto' }
              ],
              rows
            },
            timestamp
          }
        ]
      };
    }
  }

  // 5. GET-CONTENT / CAT / TYPE / GC
  if (cmd === 'type' || cmd === 'cat' || cmd === 'get-content' || cmd === 'gc') {
    if (!args[0]) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `The syntax of the command is incorrect.`
              : `Get-Content : Cannot bind argument to parameter 'Path' because it is null.`,
            timestamp
          }
        ]
      };
    }

    const resolved = normalizePath(args[0], currentCwd);
    const node = getNodeAtPath(vfs, resolved);

    if (!node) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `The system cannot find the file specified.`
              : `Get-Content : Cannot find path '${resolved}' because it does not exist.`,
            timestamp
          }
        ]
      };
    }

    if (node.type === 'directory') {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: mode === 'cmd'
              ? `Access is denied.`
              : `Get-Content : Path '${resolved}' is a directory and cannot be read as a file stream.`,
            timestamp
          }
        ]
      };
    }

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: node.content || '(File is empty)',
          timestamp
        }
      ]
    };
  }

  // 6. MKDIR / MD / NEW-ITEM (Directory)
  if (cmd === 'mkdir' || cmd === 'md' || (cmd === 'new-item' && args.includes('-type') && args.includes('directory'))) {
    const dirName = args.find(a => !a.startsWith('-')) || 'NewFolder';
    const res = createDirectory(vfs, normalizePath(dirName, currentCwd));

    if (!res.success) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: res.error || 'Failed to create directory',
            timestamp
          }
        ]
      };
    }

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: mode === 'cmd' ? '' : `\n    Directory: ${currentCwd}\n\nMode          LastWriteTime         Length Name\n----          -------------         ------ ----\nd-----        ${new Date().toLocaleString()}            ${dirName}\n`,
          timestamp
        }
      ]
    };
  }

  // 7. NEW-ITEM / ECHO / WRITE-HOST / SET-CONTENT / OUT-FILE (File creation/writing)
  if (cmd === 'new-item' || cmd === 'ni' || cmd === 'set-content' || cmd === 'sc' || cmd === 'echo' || cmd === 'write-host') {
    // Handle redirection e.g. echo "hello" > file.txt or Set-Content -Path file.txt -Value "hello"
    if (trimmed.includes('>')) {
      const redirectParts = trimmed.split('>');
      const leftStr = redirectParts[0].trim();
      const rightFile = redirectParts[1].trim().replace(/^>/, '').trim();

      let fileContent = leftStr;
      if (leftStr.toLowerCase().startsWith('echo ')) fileContent = leftStr.substring(5).replace(/^['"]|['"]$/g, '');
      if (leftStr.toLowerCase().startsWith('write-host ')) fileContent = leftStr.substring(11).replace(/^['"]|['"]$/g, '');

      const res = createFile(vfs, normalizePath(rightFile, currentCwd), fileContent);
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text: res.success ? `Created/updated file ${rightFile}` : `Error: ${res.error}`,
            timestamp
          }
        ]
      };
    }

    if (cmd === 'echo' || cmd === 'write-host') {
      const message = args.join(' ').replace(/^['"]|['"]$/g, '');
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text: message,
            timestamp
          }
        ]
      };
    }

    // Default New-Item file
    const targetFile = args.find(a => !a.startsWith('-')) || 'NewFile.txt';
    const res = createFile(vfs, normalizePath(targetFile, currentCwd), '');

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: res.success ? `Created item: ${targetFile}` : res.error || 'Failed to create file',
          timestamp
        }
      ]
    };
  }

  // 8. REMOVE-ITEM / RM / DEL / RD / RMDIR
  if (cmd === 'rm' || cmd === 'del' || cmd === 'remove-item' || cmd === 'rd' || cmd === 'rmdir') {
    const target = args.find(a => !a.startsWith('-'));
    if (!target) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Missing required argument: Path`,
            timestamp
          }
        ]
      };
    }

    const res = deleteNode(vfs, normalizePath(target, currentCwd));
    if (!res.success) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: res.error || 'Delete operation failed',
            timestamp
          }
        ]
      };
    }

    return { lines: [] };
  }

  // 9. GET-PROCESS / PS / TASKLIST
  if (cmd === 'get-process' || cmd === 'ps' || cmd === 'tasklist') {
    if (mode === 'cmd' || cmd === 'tasklist') {
      let output = `Image Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\n`;
      MOCK_PROCESSES.forEach(p => {
        const nameCol = p.name.padEnd(25, ' ');
        const pidCol = p.id.toString().padStart(8, ' ');
        const memCol = `${(p.workingSetMB * 1024).toLocaleString()} K`.padStart(12, ' ');
        output += `${nameCol} ${pidCol} Console                  1 ${memCol}\n`;
      });
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text: output,
            timestamp
          }
        ]
      };
    }

    const rows = MOCK_PROCESSES.map(p => ({
      handles: Math.floor(p.workingSetMB * 1.5),
      npm: Math.floor(p.workingSetMB / 4),
      pm: p.workingSetMB * 1024,
      ws: p.workingSetMB * 1024,
      cpu: p.cpu.toFixed(2),
      id: p.id,
      processName: p.name
    }));

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'table',
          tableData: {
            columns: [
              { key: 'id', label: 'Id', width: 'w-16' },
              { key: 'processName', label: 'ProcessName', width: 'w-44' },
              { key: 'cpu', label: 'CPU(s)', width: 'w-24' },
              { key: 'ws', label: 'WS(K)', width: 'w-28' },
              { key: 'handles', label: 'Handles', width: 'w-20' }
            ],
            rows
          },
          timestamp
        }
      ]
    };
  }

  // 10. GET-SERVICE / SERVICES
  if (cmd === 'get-service' || cmd === 'services.msc') {
    const rows = MOCK_SERVICES.map(s => ({
      status: s.status,
      name: s.name,
      displayName: s.displayName
    }));

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'table',
          tableData: {
            columns: [
              { key: 'status', label: 'Status', width: 'w-24' },
              { key: 'name', label: 'Name', width: 'w-36' },
              { key: 'displayName', label: 'DisplayName', width: 'w-auto' }
            ],
            rows
          },
          timestamp
        }
      ]
    };
  }

  // 11. IPCONFIG / GET-NETIPADDRESS (Queries Real System / Agent Interfaces)
  if (cmd === 'ipconfig' || cmd === 'get-netipaddress') {
    try {
      const res = await fetch('/api/real/network-interfaces');
      const data = await res.json();

      let text = `Windows IP Configuration\n\nHost Name . . . . . . . . . . . . : ${data.hostname}\nSystem Platform . . . . . . . . . : ${data.platform} (${data.arch})\nReal Local Agent Paired . . . . . : ${data.isRealAgentConnected ? 'YES (Live Workstation Stream)' : 'NO (Server Interface Mode)'}\n\n`;

      if (data.interfaces && typeof data.interfaces === 'object') {
        Object.keys(data.interfaces).forEach((ifaceName) => {
          const list = data.interfaces[ifaceName] || [];
          text += `Ethernet adapter ${ifaceName}:\n\n`;
          if (Array.isArray(list)) {
            list.forEach((details: any) => {
              text += `   IP Address / Family . . . . . . . : ${details.address || details.IPAddress || '127.0.0.1'} (${details.family || 'IPv4'})\n`;
              if (details.netmask) text += `   Subnet Mask . . . . . . . . . . . : ${details.netmask}\n`;
              if (details.mac) text += `   Physical Address (MAC) . . . . . : ${details.mac}\n`;
            });
          } else {
            text += `   IP Address . . . . . . . . . . . : ${JSON.stringify(list)}\n`;
          }
          text += `\n`;
        });
      }

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text,
            timestamp
          }
        ]
      };
    } catch (e: any) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Failed to query real network interfaces: ${e.message}`,
            timestamp
          }
        ]
      };
    }
  }

  // 11b. TEST-IPNETWORK / SUBNET SCAN (Real TCP socket probes)
  if (cmd === 'test-ipnetwork' || cmd === 'scan-network' || cmd === 'nmap-scan') {
    const targetHost = args[0] || '8.8.8.8';
    try {
      const res = await fetch('/api/real/ping-tcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: targetHost, port: 80, timeout: 3000 })
      });
      const data = await res.json();

      const text = `[+] Real TCP Network Probe on Target ${data.host}:${data.port}...
Status: [${data.status}]
Latency: ${data.latencyMs} ms
Success: ${data.success ? 'ONLINE & RESPONDING' : 'OFFLINE / UNREACHABLE'}`;

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text,
            timestamp
          }
        ]
      };
    } catch (e: any) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Network probe failed: ${e.message}`,
            timestamp
          }
        ]
      };
    }
  }

  // 11c. DISCOVER-BACNETDEVICES / TEST-BACNETWHOIS (Real UDP Socket 47808 Broadcast)
  if (cmd === 'discover-bacnetdevices' || cmd === 'test-bacnetwhois' || cmd === 'get-bacnetobjects') {
    try {
      const res = await fetch('/api/real/bacnet-whois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetIp: args[0] || '255.255.255.255', port: 47808 })
      });
      const data = await res.json();

      let text = `[Real BACnet/IP UDP Socket Engine - Port ${data.port}]
Target Broadcast Address: ${data.targetIp}
Discovered Responding Devices: ${data.discoveredCount}\n\n`;

      if (data.devices && data.devices.length > 0) {
        text += `IP Address       Port     Details / Vendor\n`;
        text += `----------       ----     ----------------\n`;
        data.devices.forEach((dev: any) => {
          text += `${(dev.ip || '127.0.0.1').padEnd(16, ' ')} ${(dev.port || 47808).toString().padEnd(8, ' ')} ${dev.vendor || dev.name || 'BACnet IP Device'}\n`;
        });
      } else {
        text += `No active BACnet devices responded to UDP Who-Is broadcast on port 47808.\nTip: Download & run 'Agent.ps1' on your local physical machine to bridge local BACnet VLAN controllers!`;
      }

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text,
            timestamp
          }
        ]
      };
    } catch (e: any) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `BACnet discovery failed: ${e.message}`,
            timestamp
          }
        ]
      };
    }
  }

  // 11d. TEST-FOXPORT / GET-NIAGARASTATIONSTATUS / TEST-NIAGARAFOXCONNECTION
  if (cmd === 'test-foxport' || cmd === 'get-niagarastationstatus' || cmd === 'test-niagarafoxconnection') {
    const host = args[0] || '127.0.0.1';
    try {
      const foxRes = await fetch('/api/real/ping-tcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: 1911, timeout: 2500 })
      });
      const foxData = await foxRes.json();

      const foxsRes = await fetch('/api/real/ping-tcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: 4911, timeout: 2500 })
      });
      const foxsData = await foxsRes.json();

      const text = `[Tridium Niagara Fox Real Socket Probe]
Target Station Host: ${host}

1. TCP Port 1911 (Fox Protocol): ${foxData.status} (${foxData.latencyMs}ms)
2. TCP Port 4911 (Foxs TLS Encrypted): ${foxsData.status} (${foxsData.latencyMs}ms)

Diagnostics Result:
${foxData.success || foxsData.success ? '✅ Tridium Niagara Fox station port is ACTIVE and reachable!' : '⚠️ Fox port unreachable on ' + host + '. Ensure station is running and firewall rules allow TCP 1911/4911.'}`;

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text,
            timestamp
          }
        ]
      };
    } catch (e: any) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Niagara Fox probe error: ${e.message}`,
            timestamp
          }
        ]
      };
    }
  }

  // 12. PING (Real TCP Socket Ping)
  if (cmd === 'ping') {
    const host = args[0] || '8.8.8.8';
    try {
      const res = await fetch('/api/real/ping-tcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: 80, timeout: 3000 })
      });
      const data = await res.json();

      const text = `Pinging ${host} with 32 bytes of data:
Reply from ${host}: bytes=32 time=${data.latencyMs}ms status=${data.status}

Ping statistics for ${host}:
    Packets: Sent = 1, Received = ${data.success ? 1 : 0}, Lost = ${data.success ? 0 : 1} (${data.success ? '0' : '100'}% loss),
Approximate round trip times in milli-seconds:
    Minimum = ${data.latencyMs}ms, Maximum = ${data.latencyMs}ms, Average = ${data.latencyMs}ms`;

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stdout',
            text,
            timestamp
          }
        ]
      };
    } catch (e: any) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Ping command failed: ${e.message}`,
            timestamp
          }
        ]
      };
    }
  }

  // 13. SYSTEMINFO
  if (cmd === 'systeminfo') {
    const text = `Host Name:                 AI-STUDIO-WIN11
OS Name:                   Microsoft Windows 11 Enterprise
OS Version:                10.0.22631 N/A Build 22631
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Workstation
OS Build Type:             Multiprocessor Free
Registered Owner:          Admin User
Registered Organization:   Google AI Studio
System Manufacturer:       Google Cloud Run Platform
System Model:              AI Virtual Container Workstation
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: AMD EPYC 7B12 16-Core Processor ~2.25GHz
BIOS Version:              Google Cloud Compute BIOS v1.0
System Directory:          C:\\Windows\\System32
Windows Directory:         C:\\Windows
Total Physical Memory:     16,384 MB
Available Physical Memory: 11,840 MB
Virtual Memory: Max Size:  24,576 MB
Virtual Memory: Available: 18,200 MB
Hotfix(s):                 3 Hotfix(s) Installed.
                           [01]: KB5037771
                           [02]: KB5038000
                           [03]: KB5039011
Network Card(s):           1 NIC(s) Installed.
                           [01]: Virtual Ethernet Adapter (192.168.1.105)
`;
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text,
          timestamp
        }
      ]
    };
  }

  // 14. TREE
  if (cmd === 'tree') {
    const target = normalizePath(args[0] || currentCwd, currentCwd);
    const node = getNodeAtPath(vfs, target);

    if (!node || node.type !== 'directory') {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `Invalid path for tree command: ${target}`,
            timestamp
          }
        ]
      };
    }

    let treeText = `Folder PATH listing for volume C:\n${target}\n`;
    function renderTree(dirNode: FileNode, indent: string = '') {
      if (!dirNode.children) return;
      const keys = Object.keys(dirNode.children);
      keys.forEach((key, idx) => {
        const isLast = idx === keys.length - 1;
        const child = dirNode.children![key];
        const connector = isLast ? '└── ' : '├── ';
        treeText += `${indent}${connector}${child.name}${child.type === 'directory' ? '\\' : ''}\n`;
        if (child.type === 'directory') {
          renderTree(child, indent + (isLast ? '    ' : '│   '));
        }
      });
    }

    renderTree(node);
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: treeText,
          timestamp
        }
      ]
    };
  }

  // 15. WHOAMI
  if (cmd === 'whoami') {
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: `AI-STUDIO-WIN11\\Admin`,
          timestamp
        }
      ]
    };
  }

  // 16. VER / VERSION
  if (cmd === 'ver' || cmd === 'version') {
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: mode === 'cmd'
            ? `Microsoft Windows [Version 10.0.22631.3593]`
            : `PowerShell 7.4.2 / Windows PowerShell v5.1.22621`,
          timestamp
        }
      ]
    };
  }

  // 17. GET-DATE / DATE / TIME
  if (cmd === 'get-date' || cmd === 'date' || cmd === 'time') {
    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: new Date().toString(),
          timestamp
        }
      ]
    };
  }

  // 18. GET-HISTORY / HISTORY / H
  if (cmd === 'get-history' || cmd === 'history' || cmd === 'h') {
    const rows = historyList.map((cmdStr, idx) => ({
      id: idx + 1,
      command: cmdStr
    }));

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'table',
          tableData: {
            columns: [
              { key: 'id', label: 'Id', width: 'w-16' },
              { key: 'command', label: 'CommandLine', width: 'w-auto' }
            ],
            rows
          },
          timestamp
        }
      ]
    };
  }

  // 19. SCRIPT EXECUTION (.ps1 or .bat)
  if (trimmed.endsWith('.ps1') || trimmed.endsWith('.bat') || trimmed.startsWith('.\\') || trimmed.startsWith('.\\\\')) {
    const scriptPath = trimmed.replace(/^\.\\/, '').replace(/^\.\\\\/, '');
    const resolved = normalizePath(scriptPath, currentCwd);
    const node = getNodeAtPath(vfs, resolved);

    if (!node || node.type !== 'file') {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            type: 'stderr',
            text: `File not found: '${resolved}'. Check script path and filename extension.`,
            timestamp
          }
        ]
      };
    }

    // Execute script lines
    const scriptLines = (node.content || '').split('\n');
    let scriptOutput = `Executing script: ${node.name}\n-----------------------------------\n`;

    scriptLines.forEach(l => {
      const lineTrim = l.trim();
      if (!lineTrim || lineTrim.startsWith('#') || lineTrim.toLowerCase().startsWith('rem ') || lineTrim.toLowerCase().startsWith('@echo off')) return;
      if (lineTrim.toLowerCase().startsWith('write-host ')) {
        scriptOutput += `${lineTrim.substring(11).replace(/^['"]|['"]$/g, '')}\n`;
      } else if (lineTrim.toLowerCase().startsWith('echo ')) {
        scriptOutput += `${lineTrim.substring(5).replace(/^['"]|['"]$/g, '')}\n`;
      } else {
        scriptOutput += `[Exec]: ${lineTrim}\n`;
      }
    });

    scriptOutput += `-----------------------------------\nScript executed successfully.`;

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'script_code',
          text: scriptOutput,
          timestamp
        }
      ]
    };
  }

  // 20. GET-HELP / HELP / MAN
  if (cmd === 'get-help' || cmd === 'help' || cmd === 'man') {
    const topic = args[0]?.toLowerCase() || '';
    let helpText = `TOPIC
    Windows PowerShell & Command Prompt Engine (AI Powered)

SHORT DESCRIPTION
    Provides an interactive Windows terminal experience with virtual file system,
    process manager, script runner, and Gemini AI integration.

SUPPORTED COMMANDS & CMDS:
    Get-ChildItem (dir, ls)  - List files and directories
    Set-Location (cd)        - Change working directory
    Get-Content (type, cat)  - Read file contents
    New-Item (mkdir, echo)   - Create directory or file
    Remove-Item (rm, del)    - Delete files or folders
    Get-Process (ps)         - List active processes
    Get-Service              - List Windows system services
    ipconfig / ping          - Network diagnostics
    systeminfo               - Complete Windows system overview
    tree                     - View directory tree graph
    whoami                   - Get active user context
    Clear-Host (cls)         - Clear terminal buffer

AI COMMANDS:
    ai <natural language>    - Convert plain English to PowerShell/CMD command
    ? <natural language>     - Shortcut for AI translation
    Click 'Fix Error with AI'- Instant AI analysis of failed commands!
`;

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          type: 'stdout',
          text: helpText,
          timestamp
        }
      ]
    };
  }

  // UNKNOWN COMMAND -> Generate Error & Offer AI Diagnosis Trigger
  const errorMsg = mode === 'cmd'
    ? `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`
    : `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.\nAt line:1 char:1\n+ ${trimmed}\n+ ~${'~'.repeat(cmd.length - 1)}`;

  return {
    lines: [
      {
        id: crypto.randomUUID(),
        type: 'stderr',
        text: errorMsg,
        timestamp,
        aiDetails: {
          rootCause: `Command '${cmd}' not recognized in ${mode}.`,
          suggestedFixCommand: `ai "${trimmed}"`
        }
      }
    ]
  };
}

// Utility to parse command line strings respecting quoted arguments
function parseCommandLineArgs(input: string): string[] {
  const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    matches.push(match[0].replace(/^["']|["']$/g, ''));
  }
  return matches;
}
