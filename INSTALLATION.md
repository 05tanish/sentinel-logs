# Installation Guide

Complete installation guide for Sentinel-Logs SIEM.

---

## Prerequisites

- **Docker Engine** 20.10+ and **Docker Compose** 2.0+
- **4GB RAM** minimum (8GB recommended)
- **20GB disk space**
- **Linux, macOS, or Windows** with WSL2

---

## Quick Installation (5 Minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/05tanish/sentinel-logs.git
cd sentinel-logs
```

### Step 2: Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit with your secure passwords
nano .env  # or use your preferred editor
```

**Required changes in `.env`:**
```bash
POSTGRES_PASSWORD=your_secure_database_password
JWT_SECRET=your_jwt_secret_min_32_characters
AGENT_API_KEY=your_agent_api_key_min_32_characters
GF_SECURITY_ADMIN_PASSWORD=your_grafana_password
```

**Generate secure secrets:**
```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# Agent API Key (256-bit)
openssl rand -hex 32

# Strong Password
openssl rand -base64 24
```

### Step 3: Generate SSL Certificates

```bash
cd nginx
bash generate-certs.sh
cd ..
```

**For production:** Use Let's Encrypt or your organization's CA instead of self-signed certificates.

### Step 4: Start Services

```bash
# Build and start all containers
docker-compose up --build -d

# Verify all services are running
docker-compose ps
```

Expected output:
```
NAME                          STATUS
sentinel-logs-backend-1       Up
sentinel-logs-postgres-1      Up
sentinel-logs-nginx-1         Up
sentinel-logs-grafana-1       Up
sentinel-logs-loki-1          Up
```

### Step 5: Create Admin User

```bash
docker exec -it sentinel-logs-postgres-1 psql -U siem_admin -d siem_security -c "
INSERT INTO users (username, password, role) 
VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;"
```

### Step 6: Access Your SIEM

| Service | URL | Credentials |
|---------|-----|-------------|
| **SIEM Dashboard** | https://localhost | `admin` / `admin123` |
| **Grafana** | http://localhost:3000 | `admin` / (from .env) |

⚠️ **Change the admin password immediately after first login!**

---

## Agent Installation

Install agents on servers you want to monitor.

### Step 0: Setup Logging (Important!)

**Modern Linux systems (Kali, Ubuntu 20+, Debian 11+) use journalctl instead of traditional log files.**

Run this script to auto-detect and configure logging:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/05tanish/sentinel-logs/main/scripts/setup-logging.sh
sudo bash setup-logging.sh
```

**Or manual setup:**

```bash
# Check if you have traditional logs
ls -la /var/log/auth.log

# If file doesn't exist, install rsyslog
sudo apt install rsyslog -y
sudo systemctl start rsyslog
sudo systemctl enable rsyslog

# Verify auth.log was created
ls -la /var/log/auth.log
```

### Method 1: NPM (Recommended)

```bash
# Install globally (v1.0.4 with diagnostics)
sudo npm install -g sentinel-logs-agent@latest

# Test connectivity first
siem-agent-diagnose

# Configure
siem-agent init

# Start
siem-agent start
```

**Update to latest version:**
```bash
# Update globally installed agent
sudo npm update -g sentinel-logs-agent

# Or reinstall latest
sudo npm install -g sentinel-logs-agent@latest

# Check version
npm list -g sentinel-logs-agent
```

### Method 2: From Source

```bash
# On target server
cd /opt
sudo git clone https://github.com/05tanish/sentinel-logs.git
cd sentinel-logs/Agent

# Install dependencies
sudo npm install --production

# Configure
sudo cp config.example.json config.json
sudo nano config.json
```

**Configuration (`config.json`):**
```json
{
  "backendUrl": "https://your-siem-server.com",
  "apiKey": "your_agent_api_key_from_env",
  "source": "web-server-01",
  "logPaths": [
    "/var/log/auth.log",
    "/var/log/syslog"
  ]
}
```

### Run Agent as Service (Linux)

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

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable siem-agent
sudo systemctl start siem-agent

# Check status
sudo systemctl status siem-agent
```

---

## Production Deployment

### Security Hardening

1. **Bind services to localhost** (edit `docker-compose.yml`):
   ```yaml
   ports:
     - "127.0.0.1:3100:3100"  # Loki
     - "127.0.0.1:5432:5432"  # PostgreSQL
     - "127.0.0.1:3000:3000"  # Grafana
   ```

2. **Use proper SSL certificates:**
   ```bash
   # Let's Encrypt
   sudo certbot certonly --standalone -d your-domain.com
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/server.crt
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/server.key
   ```

3. **Configure firewall:**
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 443/tcp
   sudo ufw allow 514/udp
   sudo ufw enable
   ```

4. **Set strong passwords** in `.env` (no defaults!)

5. **Enable automated backups:**
   ```bash
   bash scripts/setup-cron-backup.sh
   ```

### Environment Variables

Set these in `.env` before deployment:

```bash
# Database
POSTGRES_USER=siem_admin
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=siem_security

# Security
JWT_SECRET=<256-bit-secret>
AGENT_API_KEY=<256-bit-key>

# Grafana
GF_SECURITY_ADMIN_PASSWORD=<grafana-password>

# Application
PORT=4000
NODE_ENV=production
LOG_RETENTION_DAYS=90
ALERT_RETENTION_DAYS=365
```

---

## Air-Gapped Installation

For isolated networks without internet access:

### Step 1: Prepare on Internet-Connected Machine

```bash
# Download Docker images
docker pull nginx:alpine
docker pull postgres:15
docker pull grafana/grafana:10.0.0
docker pull grafana/loki:2.9.0
docker pull grafana/promtail:2.9.0

# Save images
docker save nginx:alpine postgres:15 grafana/grafana:10.0.0 \
  grafana/loki:2.9.0 grafana/promtail:2.9.0 -o siem-images.tar

# Clone repository
git clone https://github.com/05tanish/sentinel-logs.git
tar -czf sentinel-logs.tar.gz sentinel-logs/
```

### Step 2: Transfer to Air-Gapped System

Transfer `siem-images.tar` and `sentinel-logs.tar.gz` via USB or approved method.

### Step 3: Install on Air-Gapped System

```bash
# Load Docker images
docker load -i siem-images.tar

# Extract repository
tar -xzf sentinel-logs.tar.gz
cd sentinel-logs

# Follow normal installation steps
cp .env.example .env
# Edit .env with secure passwords
bash nginx/generate-certs.sh
docker-compose up --build -d
```

---

## Verification

### Check Services

```bash
# All services running
docker-compose ps

# Backend health
curl -k https://localhost/api/health

# Database connection
docker-compose exec postgres psql -U siem_admin -d siem_security -c "SELECT 1;"

# View logs
docker-compose logs --tail=50 backend
```

### Test Agent Connection

```bash
# From agent machine
curl -k https://your-siem-server/api/health

# Test log submission
curl -X POST https://your-siem-server/api/logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_agent_api_key" \
  -d '{"raw": "test log", "source": "test"}' \
  -k
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify database
docker-compose exec postgres psql -U siem_admin -d siem_security -c "SELECT 1;"

# Restart services
docker-compose restart backend
```

### Agent Not Connecting

```bash
# Check agent logs
sudo journalctl -u siem-agent -f

# Test connectivity
curl -k https://your-siem-server/api/health

# Verify API key matches
grep apiKey /opt/sentinel-logs/Agent/config.json
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :443
sudo lsof -i :5432

# Kill process or change port in docker-compose.yml
```

---

## Backup & Restore

### Create Backup

```bash
# Set environment variables
export DB_NAME=siem_security
export DB_USER=siem_admin
export DB_PASSWORD=your_password

# Run backup
bash scripts/backup.sh
```

### Restore Backup

```bash
# Set environment variables
export DB_NAME=siem_security
export DB_USER=siem_admin
export DB_PASSWORD=your_password

# Run restore
bash scripts/restore.sh backup-name
```

### Automated Backups

```bash
# Setup daily backups
bash scripts/setup-cron-backup.sh

# Verify cron job
crontab -l
```

---

## Uninstallation

### Stop and Remove Services

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data!)
docker-compose down -v

# Remove repository
cd ..
rm -rf sentinel-logs
```

### Remove Agent

```bash
# Stop service
sudo systemctl stop siem-agent
sudo systemctl disable siem-agent

# Remove service file
sudo rm /etc/systemd/system/siem-agent.service
sudo systemctl daemon-reload

# Remove agent files
sudo rm -rf /opt/sentinel-logs
```

---

## Next Steps

1. ✅ Change default admin password
2. ✅ Create additional user accounts
3. ✅ Deploy agents to your servers
4. ✅ Configure Grafana dashboards
5. ✅ Set up automated backups
6. ✅ Review detection rules
7. ✅ Configure alert notifications

---

## Support

- 📖 **Documentation**: [GitHub Wiki](https://github.com/05tanish/sentinel-logs/wiki)
- 🐛 **Issues**: [GitHub Issues](https://github.com/05tanish/sentinel-logs/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/05tanish/sentinel-logs/discussions)

---

**Installation complete! Your SIEM is ready to protect your infrastructure.** 🛡️
