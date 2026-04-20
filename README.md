# SIEM System

A Security Information and Event Management (SIEM) system that collects, analyzes, and visualizes logs to detect security threats like brute force attacks.

## Stack

- **Backend** — Node.js + Express (port 4000)
- **Database** — PostgreSQL 15 (port 5432)
- **Log Aggregation** — Grafana Loki (port 3100)
- **Log Shipping** — Promtail
- **Visualization** — Grafana (port 3000)

## Architecture

```
logs/ ──► Promtail ──► Loki ──► Backend API ──► PostgreSQL
                                     │
                                  Grafana
```

## Getting Started

### Prerequisites
- Docker & Docker Compose installed

### Setup

1. Clone the repo
   ```bash
   git clone <your-repo-url>
   cd siem-project
   ```

2. Create your environment file
   ```bash
   cp .env.example .env
   ```

3. Fill in your values in `.env`

4. Start all services
   ```bash
   docker-compose up --build
   ```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `LOKI_URL` | Loki endpoint (default: http://loki:3100) |
| `PORT` | Backend port (default: 4000) |
| `JWT_SECRET` | Secret key for JWT tokens |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password |
| `ALERT_THRESHOLD` | Failed login attempts before alert triggers |
| `TIME_WINDOW_MINUTES` | Time window for brute force detection |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/logs` | Fetch raw logs from Loki |
| GET | `/analyze` | Analyze logs and detect attacks |

### Example Response — `/analyze`

```json
{
  "logs": ["Failed login for user admin", "..."],
  "alert": "Brute Force Attack Detected"
}
```

## Detection

Currently detects:
- **Brute Force** — triggers when 3+ `Failed login` entries are found in logs

## Services

| Service | URL |
|---|---|
| Backend API | http://localhost:4000 |
| Grafana | http://localhost:3000 |
| Loki | http://localhost:3100 |

## Project Structure

```
siem-project/
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── logs/
│   └── app.log
├── docker-compose.yml
├── promtail-config.yml
├── .env.example
└── README.md
```
