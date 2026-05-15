# 🛡️ Sentinel-Logs

**Enterprise-Grade Security Information and Event Management (SIEM) System**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

Real-time threat detection and comprehensive security monitoring for organizations of all sizes. Built for Security Operations Centers (SOCs), IT administrators, and compliance teams.

---

## ✨ Key Features

- **Real-Time Threat Detection** - Brute force, privilege escalation, and anomaly detection
- **Multi-Source Log Collection** - Agents, REST API, Syslog, file uploads
- **Offline Resilience** - Agents cache logs locally with automatic retry
- **Role-Based Access Control** - Admin, Analyst, and Viewer roles
- **Modern Dashboard** - React-based interface with real-time updates
- **Grafana Integration** - Pre-built security dashboards and metrics
- **Production-Ready** - Docker Compose deployment, automated backups
- **Air-Gapped Support** - Works in isolated networks without internet

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space

### Installation (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/05tanish/sentinel-logs.git
cd sentinel-logs

# 2. Configure environment
cp .env.example .env
nano .env  # Set secure passwords and secrets

# 3. Generate SSL certificates
bash nginx/generate-certs.sh

# 4. Start services
docker-compose up --build -d

# 5. Create admin user
docker exec -it sentinel-logs-postgres-1 psql -U siem_admin -d siem_security -c "
INSERT INTO users (username, password, role) 
VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;"
```

### Access Your SIEM

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **SIEM Dashboard** | https://localhost | `admin` / `admin123` |
| **Grafana** | http://localhost:3000 | `admin` / (from .env) |
| **API** | https://localhost/api | JWT token required |

⚠️ **CRITICAL SECURITY STEPS:**
1. Change admin password immediately after first login
2. Use strong passwords in `.env` file
3. For production: Bind services to 127.0.0.1 (see docker-compose.yml)
4. Enable firewall rules
5. Use proper SSL certificates

---

## 🏗️ Architecture

```
Agents (Servers/Workstations)
    ↓ HTTPS + API Key
Nginx (SSL/TLS Termination)
    ↓
Backend API (Express.js)
    ├─ Parser Engine
    ├─ Rule Engine
    └─ Alert Manager
    ↓
PostgreSQL + Grafana Loki
    ↓
React Dashboard + Grafana
```

**Technology Stack:** Node.js 20, React 19, PostgreSQL 15, Grafana Loki 2.9, Nginx, Docker

---

## 🤖 Deploy Agents

Install agents on your servers to collect logs:

```bash
# Install from NPM (latest version with diagnostics)
sudo npm install -g sentinel-logs-agent@latest

# Test connectivity to backend
siem-agent-diagnose

# Configure
siem-agent init

# Start collecting
siem-agent start
```

Or deploy from source - see [INSTALLATION.md](INSTALLATION.md) for details.

---

## 🔒 Security Features

- **Authentication** - JWT tokens for users, API keys for agents
- **RBAC** - Three permission levels (Admin, Analyst, Viewer)
- **Rate Limiting** - Protection against brute force attacks
- **Encryption** - SSL/TLS for all communications
- **Audit Trail** - Complete logging of all user actions

### Built-in Detection Rules

- SSH/RDP brute force attacks
- Failed authentication patterns
- Privilege escalation attempts
- Suspicious command execution
- Service failures and anomalies

---

## 📚 Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide
- **[GitHub Wiki](https://github.com/05tanish/sentinel-logs/wiki)** - Detailed documentation and troubleshooting

For detailed documentation, configuration guide, and troubleshooting, visit our [GitHub Wiki](https://github.com/05tanish/sentinel-logs/wiki).

---

## 🛠️ Development

```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development
cd frontend
npm install
npm run dev

# Agent development
cd Agent
npm install
npm start
```

---

## 🔮 Roadmap

**2025 Q2-Q3**
- Multi-factor authentication
- Machine learning anomaly detection
- Threat intelligence integration
- WebSocket real-time updates

**2025 Q4**
- Kubernetes deployment
- Single Sign-On (SSO)
- Multi-tenancy support
- Compliance reporting (GDPR, HIPAA, PCI-DSS)

---

## 📞 Support

- 🐛 **Bug Reports** - [GitHub Issues](https://github.com/05tanish/sentinel-logs/issues)
- 💬 **Discussions** - [GitHub Discussions](https://github.com/05tanish/sentinel-logs/discussions)
- 📖 **Documentation** - [docs/](docs/)
- 💼 **Enterprise Support** - Available for production deployments

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with: [Grafana Loki](https://grafana.com/oss/loki/), [Prometheus](https://prometheus.io/), [PostgreSQL](https://www.postgresql.org/), [React](https://react.dev/), [Express.js](https://expressjs.com/)

---

<div align="center">

**Built with ❤️ for the Security Community**

*Protecting digital assets through intelligent security monitoring*

[![GitHub Stars](https://img.shields.io/github/stars/05tanish/sentinel-logs?style=social)](https://github.com/05tanish/sentinel-logs)
[![GitHub Forks](https://img.shields.io/github/forks/05tanish/sentinel-logs?style=social)](https://github.com/05tanish/sentinel-logs)

</div>
