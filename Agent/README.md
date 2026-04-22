# siem-agent

Lightweight real-time log collection agent for SIEM systems. Watches log files and ships them to your SIEM backend. Designed for high-security environments.

## Install

```bash
npm install -g siem-agent
```

## Setup

```bash
# Step 1 — interactive configuration
siem-agent init

# Step 2 — install as system service (runs forever, survives reboots)
sudo siem-agent install   # Linux / macOS
# Run as Administrator on Windows
```

## Commands

| Command | Description |
|---|---|
| `siem-agent init` | Interactive setup — creates config |
| `siem-agent start` | Start in foreground |
| `sudo siem-agent install` | Install as system service |
| `sudo siem-agent uninstall` | Remove system service |
| `siem-agent --help` | Show help |

## Platform Support

| OS | Service Manager | Auto-restart | Boot startup |
|---|---|---|---|
| Linux | systemd | ✅ | ✅ |
| macOS | launchd | ✅ | ✅ |
| Windows | Windows Service | ✅ | ✅ |

## Security Features

- Runs as root/SYSTEM — cannot be stopped by normal users
- SIGTERM/SIGINT handlers — sends alert to SIEM before exiting
- Heartbeat every 60s — SIEM detects silence if agent is killed
- Offline storage — logs saved to disk if backend is unreachable
- Chunked flush — sends pending logs in batches when backend recovers

## Config Location

```
~/.siem-agent/config.json       ← your settings
~/.siem-agent/pending-logs.json ← offline queue (auto-managed)
```

## Requirements

- Node.js >= 18
- Network access to SIEM backend
- Root/Administrator for service installation
