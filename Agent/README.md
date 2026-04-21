# SIEM Agent

Lightweight log collection agent. Reads log files and ships them to your SIEM backend.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Edit `config.json`
   ```json
   {
     "backendUrl": "http://your-siem-server:4000",
     "apiKey": "your_jwt_token",
     "logPaths": ["/var/log/auth.log", "/var/log/syslog"],
     "source": "web-server-1"
   }
   ```

3. Run
   ```bash
   npm start
   ```

## How it works

- Reads existing log lines on startup
- Watches log files for new lines in real time
- Sends logs in batches to backend
- If backend is down — saves logs to `pending-logs.json` on disk
- Automatically flushes pending logs when backend comes back online

## Config options

| Key | Description | Default |
|---|---|---|
| `backendUrl` | Your SIEM backend URL | `http://localhost:4000` |
| `apiKey` | JWT token from login | required |
| `logPaths` | Array of log file paths to watch | `["./logs/app.log"]` |
| `batchSize` | Logs per batch | `10` |
| `flushInterval` | How often to send (ms) | `5000` |
| `retryInterval` | How often to retry pending (ms) | `30000` |
| `source` | Identifier for this machine | `client-machine-1` |
