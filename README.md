# AI Terminal OS - Windows Systems & Network Copilot

An AI-powered standalone Windows Terminal application featuring natural language query translation, live network diagnostic probes (IP, TCP, BACnet UDP 47808, Tridium Niagara Fox 1911/4911), and automated GitHub Actions installer releases.

---

## 📦 Automated 1-Click Download via GitHub Actions

You do **NOT** need to install Node.js or run build commands manually! GitHub Actions automatically builds the Windows `.exe` installer every time code is pushed.

### How to Download Your Installer (.exe):
1. Go to your GitHub repository page.
2. Click the **Actions** tab at the top.
3. Click the latest workflow run named **"Build Windows Installer"**.
4. Scroll down to the **Artifacts** section at the bottom.
5. Click **`AI-Terminal-OS-Windows-Builds`** to download the zipped `.exe` installer!
6. Extract and run `AI Terminal OS Setup 1.0.0.exe` (Installer) or `AI Terminal OS 1.0.0.exe` (Portable App).

---

## ⚡ Features

- **Standalone Windows Desktop App**: Native Electron OS shell independent of standard PowerShell window frames.
- **Natural Language Command Auto-Execution**: Type `ai <question>` or `? <question>` to auto-translate and run terminal commands.
- **BACnet/IP Protocol Diagnostics**: Test UDP Port 47808 Who-Is broadcasts and controller discovery.
- **Tridium Niagara Fox Probes**: Test TCP Port 1911 (Fox) and TCP Port 4911 (Foxs TLS).
- **IP Network Scanner**: Scan active IP subnets and measure live TCP socket latencies.
- **PowerShell & CMD Modes**: Full support for standard cmdlets, system diagnostics, and AI copilot analysis.

