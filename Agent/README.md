# Sentinel-Logs Agent

[![npm version](https://img.shields.io/npm/v/sentinel-logs-agent.svg)](https://www.npmjs.com/package/sentinel-logs-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

Lightweight log collection agent for Sentinel-Logs SIEM. Works on Linux, Windows, and macOS.

## Features

- ✅ **Cross-Platform** - Linux, Windows, macOS
- ✅ **Real-Time Monitoring** - Watches log files for changes
- ✅ **Offline Support** - Caches logs when network unavailable
- ✅ **Auto-Retry** - Automatic reconnection and log transmission
- ✅ **Low Resource Usage** - Minimal CPU and memory footprint
- ✅ **Secure** - HTTPS with API key authentication

## Installation

### NPM (Recommended)

```bash
npm install -g sentinel-logs-agent
```

### From Source

```bash
git clone https://github.com/05tanish/sentinel-logs.git
cd sentinel-logs/Agent
npm install --production
```

## Quick Start

### 1. Configure

Create `config.json`:

```json
{
  "backendUrl": "https://your-siem-server.com",
  "apiKey": "your_agent_api_key",
  "source": "web-server-01",
  "logPaths": [
    "/var/log/auth.log",
    "/var/log/syslog"
  ]
}
```

### 2. Run

```bash
# Start agent
node index.js

# Or if installed via NPM
siem-agent start
```

## Configuration

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `backendUrl` | Yes | SIEM server URL | `https://10.0.1.100` |
| `apiKey` | Yes | Agent API key | `sentinel_key_abc123...` |
| `source` | Yes | Unique agent identifier | `web-server-01` |
| `logPaths` | Yes | Log files to monitor | `["/var/log/auth.log"]` |
| `retryInterval` | No | Retry delay (ms) | `30000` (default) |

## Run as Service

### Linux (systemd)

```bash
sudo tee /etc/systemd/system/siem-agent.service > /dev/null <<EOF
[Unit]
Description=Sentinel-Logs Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sentinel-logs/Agent
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable siem-agent
sudo systemctl start siem-agent
```

### Windows (NSSM)

```powershell
# Install NSSM
choco install nssm

# Install service
nssm install SentinelAgent "C:\Program Files\nodejs\node.exe" "C:\sentinel-logs\Agent\index.js"
nssm start SentinelAgent
```

## Common Log Paths

### Linux
```
/var/log/auth.log       # Authentication logs
/var/log/syslog         # System logs
/var/log/nginx/*.log    # Nginx logs
/var/log/apache2/*.log  # Apache logs
```

### Windows
```
C:\Windows\System32\winevt\Logs\Security.evtx
C:\inetpub\logs\LogFiles\W3SVC1\*.log
```

### macOS
```
/var/log/system.log
/var/log/secure.log
```

## Verification

```bash
# Check agent status
sudo systemctl status siem-agent

# View logs
sudo journalctl -u siem-agent -f

# Test connectivity
curl -k https://your-siem-server/api/health
```

## Troubleshooting

### Agent shows "Backend offline"

```bash
# Test connectivity
curl -k https://your-siem-server/api/health

# Check firewall
sudo ufw status

# Verify API key
cat config.json | grep apiKey
```

### No logs being sent

```bash
# Check log file permissions
ls -la /var/log/auth.log

# Make readable
sudo chmod 644 /var/log/auth.log

# Restart agent
sudo systemctl restart siem-agent
```

### High CPU usage

Reduce monitored files or increase `retryInterval` in config.

## Development

```bash
# Install dependencies
npm install

# Run in development
npm start

# Run tests
npm test
```

## API

### Heartbeat
```http
POST /api/agent/heartbeat
Content-Type: application/json
x-api-key: your-api-key

{
  "source": "agent-name",
  "hostname": "server-01",
  "platform": "linux",
  "status": "online"
}
```

### Log Submission
```http
POST /api/logs
Content-Type: application/json
x-api-key: your-api-key

{
  "source": "agent-name",
  "raw": "log message",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Links

- **GitHub**: https://github.com/05tanish/sentinel-logs
- **NPM**: https://www.npmjs.com/package/sentinel-logs-agent
- **Documentation**: https://github.com/05tanish/sentinel-logs/wiki
- **Issues**: https://github.com/05tanish/sentinel-logs/issues

## License

MIT License - see [LICENSE](LICENSE)

---

**Made with ❤️ for Security Professionals**
