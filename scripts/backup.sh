#!/bin/bash

###############################################################################
# Sentinel-Logs Backup Script
# Creates a complete backup of the SIEM system including database and logs
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="sentinel-logs-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Database configuration (from .env or environment - REQUIRED)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

# Validate required variables
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
  echo -e "${RED}Error: Required environment variables not set${NC}"
  echo ""
  echo "Please set the following environment variables:"
  echo "  DB_NAME - Database name"
  echo "  DB_USER - Database username"
  echo "  DB_PASSWORD - Database password"
  echo ""
  echo "Example:"
  echo "  export DB_NAME=siem_security"
  echo "  export DB_USER=siem_admin"
  echo "  export DB_PASSWORD=your_secure_password"
  echo ""
  exit 1
fi

# Retention policy (days)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Sentinel-Logs Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create backup directory
echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p "${BACKUP_PATH}"

# Backup PostgreSQL database
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
export PGPASSWORD="${DB_PASSWORD}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -F c -b -v -f "${BACKUP_PATH}/database.dump" 2>&1 | grep -v "^$" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo -e "${GREEN}✓ Database backup completed${NC}"
else
  echo -e "${RED}✗ Database backup failed${NC}"
  exit 1
fi

# Backup configuration files
echo -e "${YELLOW}Backing up configuration files...${NC}"
mkdir -p "${BACKUP_PATH}/config"

# Backend config
if [ -f ".env" ]; then
  cp .env "${BACKUP_PATH}/config/.env"
  echo -e "${GREEN}✓ Backed up .env${NC}"
fi

if [ -f "docker-compose.yml" ]; then
  cp docker-compose.yml "${BACKUP_PATH}/config/docker-compose.yml"
  echo -e "${GREEN}✓ Backed up docker-compose.yml${NC}"
fi

# Nginx config
if [ -d "nginx" ]; then
  cp -r nginx "${BACKUP_PATH}/config/"
  echo -e "${GREEN}✓ Backed up nginx configuration${NC}"
fi

# Monitoring config
if [ -d "backend/src/monitoring" ]; then
  cp -r backend/src/monitoring "${BACKUP_PATH}/config/"
  echo -e "${GREEN}✓ Backed up monitoring configuration${NC}"
fi

# Backup agent configurations (if any)
if [ -d "Agent" ]; then
  mkdir -p "${BACKUP_PATH}/agent"
  if [ -f "Agent/config.json" ]; then
    cp Agent/config.json "${BACKUP_PATH}/agent/"
    echo -e "${GREEN}✓ Backed up agent configuration${NC}"
  fi
fi

# Create backup metadata
echo -e "${YELLOW}Creating backup metadata...${NC}"
cat > "${BACKUP_PATH}/backup-info.txt" << EOF
Sentinel-Logs Backup Information
=================================
Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}

Contents:
- PostgreSQL database dump (database.dump)
- Configuration files (config/)
- Agent configurations (agent/)

Restore Instructions:
Run: ./scripts/restore.sh ${BACKUP_NAME}
EOF

echo -e "${GREEN}✓ Backup metadata created${NC}"

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
cd - > /dev/null

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Backup compressed (${BACKUP_SIZE})${NC}"

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "sentinel-logs-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "sentinel-logs-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} | wc -l)
echo -e "${GREEN}✓ Cleaned up ${DELETED_COUNT} old backups${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "Backup size: ${BACKUP_SIZE}"
echo -e "To restore: ./scripts/restore.sh ${BACKUP_NAME}"
echo ""

# Optional: Upload to remote storage (uncomment and configure)
# echo -e "${YELLOW}Uploading to remote storage...${NC}"
# scp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" user@backup-server:/backups/
# echo -e "${GREEN}✓ Uploaded to remote storage${NC}"

exit 0
