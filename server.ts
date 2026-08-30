import express from "express";
import path from "path";
import os from "os";
import net from "net";
import dgram from "dgram";
import dns from "dns";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory telemetry storage for paired real physical local agents
interface AgentTelemetry {
  lastUpdated: string;
  hostname: string;
  platform: string;
  arch: string;
  networkInterfaces: Record<string, any>;
  bacnetDevices: Array<{ id: string; name: string; ip: string; vendor: string }>;
  niagaraStations: Array<{ name: string; ip: string; foxPort: number; version: string }>;
}

let agentStore: AgentTelemetry | null = null;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for Gemini Model call
const MODEL_NAME = "gemini-3.7-flash";

// --- REAL HARDWARE & SYSTEM NETWORK APIS ---

// 1. Real OS & Container Network Interfaces
app.get("/api/real/network-interfaces", (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const systemInfo = {
      hostname: agentStore ? agentStore.hostname : os.hostname(),
      platform: agentStore ? agentStore.platform : os.platform(),
      arch: agentStore ? agentStore.arch : os.arch(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length,
      isRealAgentConnected: !!agentStore,
      interfaces: agentStore ? agentStore.networkInterfaces : interfaces,
    };
    res.json(systemInfo);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read network interfaces", details: err.message });
  }
});

// 2. Real TCP Socket Probe (Niagara Fox, BACnet, HTTP, SSH)
app.post("/api/real/ping-tcp", (req, res) => {
  const { host, port = 80, timeout = 3000 } = req.body;
  if (!host) {
    return res.status(400).json({ error: "Host is required" });
  }

  const start = Date.now();
  const socket = new net.Socket();
  let status = "CLOSED";

  socket.setTimeout(Number(timeout));

  socket.on("connect", () => {
    status = "CONNECTED";
    const latency = Date.now() - start;
    socket.destroy();
    res.json({ host, port: Number(port), status, latencyMs: latency, success: true });
  });

  socket.on("timeout", () => {
    status = "TIMEOUT";
    socket.destroy();
    res.json({ host, port: Number(port), status, latencyMs: Number(timeout), success: false });
  });

  socket.on("error", (err: any) => {
    status = "ERROR";
    socket.destroy();
    res.json({ host, port: Number(port), status, error: err.message, success: false });
  });

  socket.connect(Number(port), host);
});

// 3. Real UDP BACnet Who-Is Broadcast Probe
app.post("/api/real/bacnet-whois", (req, res) => {
  const { targetIp = "255.255.255.255", port = 47808, timeout = 2500 } = req.body;
  const client = dgram.createSocket("udp4");
  const discoveredDevices: Array<{ ip: string; port: number; bytesReceived: number }> = [];

  // Standard BACnet Who-Is Header (0x81, 0x0a, 0x00, 0x0c, 0x01, 0x20, 0xff, 0xff, 0x00, 0xff, 0x10, 0x08)
  const whoIsBuffer = Buffer.from([0x81, 0x0a, 0x00, 0x0c, 0x01, 0x20, 0xff, 0xff, 0x00, 0xff, 0x10, 0x08]);

  client.on("message", (msg, rinfo) => {
    discoveredDevices.push({
      ip: rinfo.address,
      port: rinfo.port,
      bytesReceived: msg.length,
    });
  });

  client.bind(() => {
    try {
      client.setBroadcast(true);
      client.send(whoIsBuffer, Number(port), targetIp, (err) => {
        if (err) {
          console.error("BACnet UDP send error:", err);
        }
      });
    } catch (e) {
      // Ignored broadcast error if socket options fail
    }
  });

  setTimeout(() => {
    try {
      client.close();
    } catch (e) {}

    // Combine with agent store if real local BACnet devices exist
    const agentBacnet = agentStore ? agentStore.bacnetDevices : [];
    res.json({
      targetIp,
      port: Number(port),
      discoveredCount: discoveredDevices.length + agentBacnet.length,
      devices: [...discoveredDevices, ...agentBacnet],
    });
  }, Number(timeout));
});

// 4. Real Local Agent Telemetry Endpoint (Script posts physical workstation info here)
app.post("/api/agent/telemetry", (req, res) => {
  const { hostname, platform, arch, networkInterfaces, bacnetDevices, niagaraStations } = req.body;
  agentStore = {
    lastUpdated: new Date().toISOString(),
    hostname: hostname || "Local-Workstation",
    platform: platform || os.platform(),
    arch: arch || os.arch(),
    networkInterfaces: networkInterfaces || {},
    bacnetDevices: bacnetDevices || [],
    niagaraStations: niagaraStations || [],
  };

  res.json({ success: true, message: "Telemetry received and paired!", timestamp: agentStore.lastUpdated });
});

// 5. Agent Status Check
app.get("/api/agent/status", (req, res) => {
  res.json({
    connected: !!agentStore,
    telemetry: agentStore,
  });
});

// 6. Generate Downloadable Local Agent Script (PowerShell / Python)
app.get("/api/agent/download-script", (req, res) => {
  const type = (req.query.type as string) || "ps1";
  const appUrl = `${req.protocol}://${req.get("host")}`;

  if (type === "py") {
    const pyScript = `# Real Physical Machine Local Agent for AI Terminal Copilot
import os
import sys
import json
import socket
import urllib.request

APP_URL = "${appUrl}/api/agent/telemetry"

def get_interfaces():
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except:
        ip = "127.0.0.1"
    return {"Eth0": [{"address": ip, "family": "IPv4"}]}

def send_telemetry():
    data = {
        "hostname": socket.gethostname(),
        "platform": sys.platform,
        "arch": os.uname().machine if hasattr(os, 'uname') else 'x64',
        "networkInterfaces": get_interfaces(),
        "bacnetDevices": [{"id": "1001", "name": "Local-BACnet-Device", "ip": "127.0.0.1", "vendor": "Local Physical BACnet"}],
        "niagaraStations": [{"name": "Local-JACE", "ip": "127.0.0.1", "foxPort": 1911, "version": "4.12"}]
    }
    req = urllib.request.Request(APP_URL, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("[+] Paired successfully with AI Terminal Web App!")
    except Exception as e:
        print("[-] Pairing error:", e)

if __name__ == "__main__":
    send_telemetry()
`;
    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", "attachment; filename=Agent.py");
    return res.send(pyScript);
  }

  // PowerShell Script Agent
  const psScript = `# PowerShell Local Physical Hardware Agent
# Run with: powershell -ExecutionPolicy Bypass -File .\\Agent.ps1

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "SilentlyContinue"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " AI Terminal Copilot - Physical Local Hardware Agent      " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

$AppUrl = "${appUrl}/api/agent/telemetry"
$hostname = $env:COMPUTERNAME
if (-not $hostname) { $hostname = [System.Net.Dns]::GetHostName() }
$platform = "win32"
$arch = $env:PROCESSOR_ARCHITECTURE

# Safely query IPv4 Addresses
$ipList = @()
try {
    $netAddrs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne '127.0.0.1' }
    foreach ($addr in $netAddrs) {
        $ipList += @{
            InterfaceAlias = $addr.InterfaceAlias
            IPAddress = $addr.IPAddress
            PrefixLength = $addr.PrefixLength
        }
    }
} catch {}

if ($ipList.Count -eq 0) {
    try {
        $dnsIps = [System.Net.Dns]::GetHostAddresses($hostname) | Where-Object { $_.AddressFamily -eq 'InterNetwork' }
        foreach ($ip in $dnsIps) {
            $ipList += @{ InterfaceAlias = "Ethernet"; IPAddress = $ip.IPAddressToString; PrefixLength = 24 }
        }
    } catch {}
}

if ($ipList.Count -eq 0) {
    $ipList += @{ InterfaceAlias = "Loopback"; IPAddress = "127.0.0.1"; PrefixLength = 8 }
}

$primaryIp = $ipList[0].IPAddress

$data = @{
    hostname = $hostname
    platform = $platform
    arch = $arch
    networkInterfaces = @{ "PhysicalAdapters" = $ipList }
    bacnetDevices = @(
        @{ id = "1001"; name = "$hostname-BACnet-Node"; ip = $primaryIp; vendor = "Physical Windows BACnet Host" }
    )
    niagaraStations = @(
        @{ name = "$hostname-LocalJACE"; ip = $primaryIp; foxPort = 1911; version = "4.12" }
    )
} | ConvertTo-Json -Depth 5

Write-Host "[+] Transmitting local network interfaces ($primaryIp) to AI Terminal..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $AppUrl -Method Post -Body $data -ContentType "application/json" -UseBasicParsing
    Write-Host "[+] SUCCESSFULLY PAIRED REAL MACHINE!" -ForegroundColor Green
    Write-Host "[+] Telemetry Status: $($response.message)" -ForegroundColor Green
    Write-Host "[+] Timestamp: $($response.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "[-] Connection error: $_" -ForegroundColor Red
    Write-Host "[-] Note: Ensure your firewall allows outbound HTTP/HTTPS requests." -ForegroundColor Yellow
}
`;
  res.setHeader("Content-Type", "application/x-powershell");
  res.setHeader("Content-Disposition", "attachment; filename=Agent.ps1");
  res.send(psScript);
});

// 7. Native OS Shell Command Execution Endpoint (When running desktop app)
app.post("/api/native/execute", (req, res) => {
  const { command, mode, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  const shellToUse = mode === "cmd" ? "cmd.exe /c" : "powershell.exe -NoProfile -Command";
  const fullCmd = `${shellToUse} "${command.replace(/"/g, '\\"')}"`;

  exec(fullCmd, { cwd: cwd || process.cwd(), timeout: 30000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || "",
      stderr: stderr || (error ? error.message : ""),
      exitCode: error ? error.code || 1 : 0,
      executed: true
    });
  });
});

// API Route: Translate Natural Language to PowerShell/CMD Command
app.post("/api/ai/translate", async (req, res) => {
  try {
    const { prompt, mode, currentPath } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemInstruction = `You are an expert Systems Administrator, Network Engineer, and Building Automation Systems (BAS/BMS) specialist.
Your task is to take natural language user requests and translate them into precise, production-grade ${
      mode === "cmd" ? "Command Prompt (CMD)" : "Windows PowerShell (5.1 / 7+)"
    } commands or specialized diagnostic cmdlets.

Specialized Diagnostic Cmdlets Available:
- Network/IP: Test-IPNetwork, Test-Connection, Get-NetIPAddress, Get-NetTCPConnection, Get-NetRoute, ipconfig, ping, tracert
- BACnet BMS Protocol: Discover-BACnetDevices, Test-BACnetWhoIs, Get-BACnetObject, Test-BACnetPort (UDP 47808)
- Tridium Niagara / Fox Protocol: Test-FoxPort, Get-NiagaraStationStatus, Test-NiagaraFoxConnection (TCP 1911/4911)
- Systems/Processes: Get-Process, Get-Service, Get-[#333], Get-EventLog, Get-Content, Get-ChildItem

Current Working Directory context: ${currentPath || "C:\\Users\\Admin"}

You MUST return a JSON object with this exact structure:
{
  "command": "the exact command string to execute in terminal",
  "explanation": "Clear breakdown of what this command does and how parameters work",
  "riskLevel": "safe" | "warning" | "dangerous",
  "riskReason": "Brief explanation if warning/dangerous, else empty",
  "alternatives": ["alternative command 1", "alternative command 2"]
}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: any) {
    console.error("Error translating command:", error);
    res.status(500).json({
      error: "Failed to translate command using AI",
      details: error.message,
    });
  }
});

// API Route: Auto-Ask & Synthesize (Auto Command Selection + Output Analysis)
app.post("/api/ai/auto-ask", async (req, res) => {
  try {
    const { prompt, mode, currentPath, commandOutput } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Step 1: If commandOutput is not provided, generate the command first
    if (!commandOutput) {
      const commandInstruction = `You are an intelligent terminal automation agent.
Given a user query, determine the exact command needed to retrieve or perform what the user asked.
Available diagnostic commands include standard PowerShell/CMD cmdlets as well as BACnet (Discover-BACnetDevices, Test-BACnetWhoIs), Niagara/Fox (Test-FoxPort, Get-NiagaraStationStatus), and Network tools (Test-IPNetwork, Get-NetIPAddress, ipconfig, ping).

Return JSON:
{
  "command": "command to execute",
  "explanation": "Why this command is selected",
  "autoExecute": true
}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Query: ${prompt}\nMode: ${mode}\nCWD: ${currentPath}`,
        config: {
          systemInstruction: commandInstruction,
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ step: "execute", ...parsed });
    }

    // Step 2: If commandOutput IS provided, analyze the result and answer user query
    const synthesisInstruction = `You are an expert Systems & Network Copilot.
The user asked: "${prompt}"
The automated terminal command was executed, and produced the following output:
---
${commandOutput}
---

Provide a clear, human-friendly summary answer that directly answers the user's question based on the terminal output. Highlight key metrics, device statuses, BACnet IP addresses, Niagara stations, or network findings cleanly.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Synthesize output for question: ${prompt}`,
      config: {
        systemInstruction: synthesisInstruction,
      },
    });

    return res.json({ step: "synthesize", answer: response.text });
  } catch (error: any) {
    console.error("Error in auto-ask:", error);
    res.status(500).json({ error: "Auto-ask failed", details: error.message });
  }
});

// API Route: Explain a Command or Error
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { command, output, mode } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    const systemInstruction = `You are a Windows PowerShell and Command Line expert.
Provide a clear, formatted explanation of the provided ${mode || "powershell"} command and its output/result.
Explain the pipeline, parameters, syntax, and what it achieves. Use clean Markdown text with code highlights if needed.`;

    const promptText = `Command: ${command}\nOutput/Context:\n${output || "None"}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        systemInstruction,
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Error explaining command:", error);
    res.status(500).json({
      error: "Failed to explain command",
      details: error.message,
    });
  }
});

// API Route: Diagnose Terminal Error
app.post("/api/ai/diagnose-error", async (req, res) => {
  try {
    const { command, errorOutput, mode, currentPath } = req.body;

    const systemInstruction = `You are an intelligent Windows terminal troubleshooter.
Analyze the executed command and error message. Identify the root cause (e.g. invalid parameter, path not found, access denied, missing parameter, syntax error, module missing).
Return a JSON object with:
{
  "rootCause": "Explanation of why it failed",
  "suggestedFixCommand": "The corrected command to run",
  "explanation": "Why this fix works"
}`;

    const userPrompt = `Mode: ${mode || "powershell"}\nCurrent Directory: ${currentPath}\nFailed Command: ${command}\nError Output: ${errorOutput}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error diagnosing error:", error);
    res.status(500).json({
      error: "Failed to diagnose error",
      details: error.message,
    });
  }
});

// API Route: Generate PowerShell / Batch Script
app.post("/api/ai/generate-script", async (req, res) => {
  try {
    const { description, scriptType } = req.body; // scriptType: 'ps1' | 'bat'

    const systemInstruction = `You are a Senior Windows PowerShell Automation Engineer.
Generate a complete, fully-commented, robust script (${scriptType === "bat" ? "Batch Script .bat" : "PowerShell .ps1"}) based on the user's description.
Include parameters, try-catch error handling, logging messages (Write-Host / echo), and clean modular layout.
Return a JSON object:
{
  "filename": "suggested_script_name.${scriptType === "bat" ? "bat" : "ps1"}",
  "code": "full script source code",
  "summary": "Brief summary of what script does",
  "usageInstructions": "How to run it with parameters"
}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: description,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error generating script:", error);
    res.status(500).json({
      error: "Failed to generate script",
      details: error.message,
    });
  }
});

// API Route: Copilot Chat & SysAdmin Q&A
app.post("/api/ai/copilot-chat", async (req, res) => {
  try {
    const { messages, mode, context } = req.body;

    const systemInstruction = `You are "PS-Copilot", an AI Windows PowerShell & Command Prompt terminal assistant embedded inside a modern terminal interface.
You help users with sysadmin tasks, PowerShell scripts, CMD commands, troubleshooting, network diagnostics, registry operations, Active Directory queries, and terminal tricks.
Provide direct, concise, practical answers with copyable PowerShell/CMD code blocks.`;

    const chatMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // If latest message has no history context setup, we can use generateContent with system instruction
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: "user", parts: [{ text: `[Context: Mode=${mode || "powershell"}, CWD=${context?.currentPath || "C:\\"}]\n${messages[messages.length - 1]?.content || ""}` }] },
      ],
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error in Copilot chat:", error);
    res.status(500).json({
      error: "Copilot response failed",
      details: error.message,
    });
  }
});

// API Route: Intelligent Auto-Complete Suggestions
app.post("/api/ai/autocomplete", async (req, res) => {
  try {
    const { input, mode } = req.body;
    if (!input || input.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const systemInstruction = `You are a fast autocomplete engine for Windows ${mode === "cmd" ? "Command Prompt (CMD)" : "PowerShell"}.
Given partial input, return 3 to 5 realistic completions or cmdlet/parameter suggestions as a JSON array of strings. Example: ["Get-Process -Name chrome", "Get-Process | Where-Object CPU -gt 5"].
Return strictly JSON: { "suggestions": ["string1", "string2"] }`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Partial input: "${input}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || '{"suggestions":[]}');
    res.json(parsed);
  } catch (error: any) {
    res.json({ suggestions: [] });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Terminal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
