# Sentinel-Logs Backend

REST API server for Sentinel-Logs SIEM system.

## Tech Stack

- **Node.js 20+** with Express.js
- **PostgreSQL 15** for structured data
- **Grafana Loki** for log storage
- **JWT** authentication
- **Prometheus** metrics

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp ../.env.example ../.env
# Edit .env with your settings

# Run development
npm run dev

# Run production
npm start
```

## Project Structure

```
backend/src/
├── modules/          # Feature modules
│   ├── Auth/        # Authentication
│   ├── Logsmodule/  # Log ingestion
│   ├── Alerts/      # Alert management
│   ├── Users/       # User management
│   ├── Agent/       # Agent management
│   └── Reports/     # Report generation
├── middelware/      # Express middleware
├── config/          # Database config
├── monitoring/      # Prometheus/Alertmanager
└── utilis/          # Helper functions
```

## API Endpoints

| Endpoint | Description | Auth |
|----------|-------------|------|
| `POST /api/auth/login` | User login | None |
| `POST /api/logs` | Log ingestion | API Key |
| `GET /api/logs` | Query logs | JWT |
| `GET /api/alerts` | List alerts | JWT |
| `GET /api/agents` | Agent status | JWT |
| `GET /metrics` | Prometheus metrics | None |
| `GET /health` | Health check | None |

Full API docs: [API.md](../API.md)

## Environment Variables

**Required:**
```bash
POSTGRES_USER=siem_admin
POSTGRES_PASSWORD=your_password
POSTGRES_DB=siem_security
JWT_SECRET=your_jwt_secret
AGENT_API_KEY=your_agent_key
```

**Optional:**
```bash
PORT=4000
NODE_ENV=production
LOG_RETENTION_DAYS=90
ALERT_RETENTION_DAYS=365
```

## Development

```bash
# Run with auto-reload
npm run dev

# Lint code
npm run lint
```

## Database

```bash
# Initialize schema
docker-compose exec postgres psql -U siem_admin -d siem_security -f /app/schema.sql

# Backup
bash ../scripts/backup.sh
```

## Monitoring

- **Metrics**: http://localhost:4000/metrics
- **Health**: http://localhost:4000/health
- **Prometheus**: http://localhost:9090

## License

MIT License - see [LICENSE](../LICENSE)
