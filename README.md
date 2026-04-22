# SIEM System

A portable, offline-capable Security Information and Event Management (SIEM) system for collecting, parsing, analyzing logs, and detecting cyber security threats.

## Stack

| Component | Technology |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL 15 |
| Log Aggregation | Grafana Loki |
| Log Shipping | Promtail |
| Visualization | Grafana |
| Frontend | React + Vite |
| Agent | Node.js + Chokidar |
| Containerization | Docker + Docker Compose |

## Architecture

```
Client Machines
  └── Agent (reads logs) ──► POST /api/logs
                                    │
                              Backend (Node.js)
                              ├── Parse logs
                              ├── Store in PostgreSQL
                              ├── Run Rule Engine
                              └── Create Alerts
                                    │
                         ┌──────────┴──────────┐
                      PostgreSQL             Loki
                         │                    │
                         └──────── Grafana ───┘
                                    │
                               React Dashboard
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### 1. Clone the repo
```bash
git clone https://github.com/your-username/siem-project.git
cd siem-project
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your values — especially change these:
```
POSTGRES_PASSWORD=your_strong_password
JWT_SECRET=your_random_secret_here
GF_SECURITY_ADMIN_PASSWORD=your_grafana_password
```

### 3. Start all services
```bash
docker-compose up --build
```

### 4. Seed admin user
```bash
docker exec siem-project-postgres-1 psql -U admin -d siem -c \
  "INSERT INTO users (username, password, role) VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');"
```
Default password is `password` — change it after first login.

### 5. Access the system

| Service | URL | Credentials |
|---|---|---|
| SIEM Dashboard | http://localhost:4000 | admin / password |
| Grafana | http://localhost:3000 | admin / (from .env) |
| Backend API | http://localhost:4000/api | JWT required |

---

## Agent Setup

The agent runs on client machines and ships logs to the backend.

```bash
cd agent
npm install
cp config.example.json config.json
```

Edit `config.json`:
```json
{
  "backendUrl": "http://your-siem-server:4000",
  "apiKey": "get_from_login_response",
  "logPaths": ["/var/log/auth.log", "/var/log/syslog"],
  "source": "web-server-1"
}
```

Run:
```bash
npm start
```

---

## Features

- **Multi-source log collection** — Agent, API, file upload (coming)
- **Real-time detection** — Brute force, repeated failures, more coming
- **RBAC** — Admin, Analyst, Viewer roles
- **Grafana dashboards** — Auto-provisioned on startup
- **Offline capable** — Agent stores logs locally when backend is down
- **User management** — Admin creates users, synced to Grafana automatically
- **Structured logging** — All events logged to Loki

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login |
| POST | `/api/logs` | JWT | Ingest a log |
| GET | `/api/logs` | JWT | Fetch logs from Loki |
| GET | `/api/logs/severity/:level` | JWT | Filter logs by severity |
| GET | `/api/alerts` | JWT | List alerts |
| GET | `/api/alerts/stats` | JWT | Alert statistics |
| PATCH | `/api/alerts/:id/acknowledge` | Analyst+ | Acknowledge alert |
| PATCH | `/api/alerts/:id/resolve` | Analyst+ | Resolve alert |
| POST | `/api/users` | Admin | Create user |
| GET | `/api/users` | Admin | List users |
| PATCH | `/api/users/:id/deactivate` | Admin | Deactivate user |

## Project Structure

```
siem-project/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── Auth/         ← login
│   │   │   ├── Logsmodule/   ← ingestion, parsing, rule engine
│   │   │   ├── Alerts/       ← alert management
│   │   │   └── Users/        ← user management
│   │   ├── middelware/       ← JWT auth, RBAC, error handling
│   │   ├── utilis/           ← helpers, logger, JWT utils
│   │   └── config/           ← DB connection, schema
│   └── Dockerfile
├── frontend/                 ← React dashboard
├── agent/                    ← log collection agent
├── grafana/provisioning/     ← auto-configured data sources
├── logs/                     ← log files watched by Promtail
├── docker-compose.yml
├── promtail-config.yml
└── .env.example
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `LOKI_URL` | Loki endpoint |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password |
| `PORT` | Backend port (default 4000) |
