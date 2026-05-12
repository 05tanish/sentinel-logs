#!/bin/bash

###############################################################################
# Sentinel-Logs Restore Script
# Restores a backup of the SIEM system including database and logs
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup name provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No backup name provided${NC}"
  echo ""
  echo "Usage: $0 <backup-name>"
  echo ""
  echo "Available backups:"
  ls -1 "${BACKUP_DIR}" | grep "sentinel-logs-backup-.*\.tar\.gz" | sed 's/.tar.gz$//' || echo "  No backups found"
  exit 1
fi

BACKUP_NAME="$1"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Check if backup exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
  echo ""
  echo "Available backups:"
  ls -1 "${BACKUP_DIR}" | grep "sentinel-logs-backup-.*\.tar\.gz" | sed 's/.tar.gz$//' || echo "  No backups found"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Sentinel-Logs Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: This will overwrite the current database and configuration!${NC}"
echo -e "${YELLOW}Make sure you have a backup of the current system before proceeding.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo -e "${YELLOW}Restore cancelled${NC}"
  exit 0
fi

# Extract backup
echo -e "${YELLOW}Extracting backup...${NC}"
TEMP_DIR=$(mktemp -d)
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
BACKUP_PATH="${TEMP_DIR}/${BACKUP_NAME}"

if [ ! -d "${BACKUP_PATH}" ]; then
  echo -e "${RED}Error: Invalid backup structure${NC}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo -e "${GREEN}✓ Backup extracted${NC}"

# Show backup info
if [ -f "${BACKUP_PATH}/backup-info.txt" ]; then
  echo ""
  echo -e "${YELLOW}Backup Information:${NC}"
  cat "${BACKUP_PATH}/backup-info.txt"
  echo ""
fi

# Restore database
echo -e "${YELLOW}Restoring PostgreSQL database...${NC}"
echo -e "${YELLOW}Note: This will drop and recreate the database${NC}"

export PGPASSWORD="${DB_PASSWORD}"

# Drop existing database (if exists)
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>&1 | grep -v "^$" || true

# Create new database
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
  -c "CREATE DATABASE ${DB_NAME};" 2>&1 | grep -v "^$" || true

# Restore database dump
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -v "${BACKUP_PATH}/database.dump" 2>&1 | grep -v "^$" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo -e "${GREEN}✓ Database restored${NC}"
else
  echo -e "${RED}✗ Database restore failed${NC}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

# Restore configuration files
echo -e "${YELLOW}Restoring configuration files...${NC}"

if [ -f "${BACKUP_PATH}/config/.env" ]; then
  cp "${BACKUP_PATH}/config/.env" .env
  echo -e "${GREEN}✓ Restored .env${NC}"
fi

if [ -f "${BACKUP_PATH}/config/docker-compose.yml" ]; then
  cp "${BACKUP_PATH}/config/docker-compose.yml" docker-compose.yml
  echo -e "${GREEN}✓ Restored docker-compose.yml${NC}"
fi

if [ -d "${BACKUP_PATH}/config/nginx" ]; then
  cp -r "${BACKUP_PATH}/config/nginx" .
  echo -e "${GREEN}✓ Restored nginx configuration${NC}"
fi

if [ -d "${BACKUP_PATH}/config/monitoring" ]; then
  mkdir -p backend/src/monitoring
  cp -r "${BACKUP_PATH}/config/monitoring/"* backend/src/monitoring/
  echo -e "${GREEN}✓ Restored monitoring configuration${NC}"
fi

# Restore agent configurations
if [ -d "${BACKUP_PATH}/agent" ]; then
  mkdir -p Agent
  if [ -f "${BACKUP_PATH}/agent/config.json" ]; then
    cp "${BACKUP_PATH}/agent/config.json" Agent/
    echo -e "${GREEN}✓ Restored agent configuration${NC}"
  fi
fi

# Clean up
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✓ Cleanup completed${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the restored configuration files"
echo "2. Restart the application: docker-compose down && docker-compose up -d"
echo "3. Verify the system is working correctly"
echo ""

exit 0
