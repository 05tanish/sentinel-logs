#!/bin/bash

###############################################################################
# Setup Automated Backups with Cron
# Configures daily automated backups for Sentinel-Logs
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Sentinel-Logs Automated Backup Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup.sh"

# Check if backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
  echo -e "${RED}Error: Backup script not found at ${BACKUP_SCRIPT}${NC}"
  exit 1
fi

# Make sure backup script is executable
chmod +x "${BACKUP_SCRIPT}"

echo "Project directory: ${PROJECT_DIR}"
echo "Backup script: ${BACKUP_SCRIPT}"
echo ""

# Ask for backup schedule
echo "Select backup schedule:"
echo "1) Daily at 2:00 AM"
echo "2) Daily at 3:00 AM"
echo "3) Every 12 hours"
echo "4) Every 6 hours"
echo "5) Custom cron expression"
echo ""
read -p "Enter your choice (1-5): " SCHEDULE_CHOICE

case ${SCHEDULE_CHOICE} in
  1)
    CRON_SCHEDULE="0 2 * * *"
    SCHEDULE_DESC="Daily at 2:00 AM"
    ;;
  2)
    CRON_SCHEDULE="0 3 * * *"
    SCHEDULE_DESC="Daily at 3:00 AM"
    ;;
  3)
    CRON_SCHEDULE="0 */12 * * *"
    SCHEDULE_DESC="Every 12 hours"
    ;;
  4)
    CRON_SCHEDULE="0 */6 * * *"
    SCHEDULE_DESC="Every 6 hours"
    ;;
  5)
    read -p "Enter custom cron expression: " CRON_SCHEDULE
    SCHEDULE_DESC="Custom: ${CRON_SCHEDULE}"
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

# Create log directory for cron jobs
LOG_DIR="${PROJECT_DIR}/logs"
mkdir -p "${LOG_DIR}"

# Cron job command
CRON_COMMAND="cd ${PROJECT_DIR} && ${BACKUP_SCRIPT} >> ${LOG_DIR}/backup-cron.log 2>&1"

# Check if cron job already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "${BACKUP_SCRIPT}" || true)

if [ -n "${EXISTING_CRON}" ]; then
  echo -e "${YELLOW}Warning: A cron job for this backup script already exists:${NC}"
  echo "${EXISTING_CRON}"
  echo ""
  read -p "Do you want to replace it? (yes/no): " REPLACE
  
  if [ "${REPLACE}" != "yes" ]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 0
  fi
  
  # Remove existing cron job
  (crontab -l 2>/dev/null | grep -v -F "${BACKUP_SCRIPT}") | crontab -
  echo -e "${GREEN}✓ Removed existing cron job${NC}"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "${CRON_SCHEDULE} ${CRON_COMMAND}") | crontab -

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Automated backup configured!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Schedule: ${SCHEDULE_DESC}"
echo "Cron expression: ${CRON_SCHEDULE}"
echo "Log file: ${LOG_DIR}/backup-cron.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove this cron job: crontab -e (then delete the line)"
echo "To view backup logs: tail -f ${LOG_DIR}/backup-cron.log"
echo ""

# Test backup script
echo -e "${YELLOW}Would you like to run a test backup now? (yes/no)${NC}"
read -p "> " RUN_TEST

if [ "${RUN_TEST}" = "yes" ]; then
  echo ""
  echo -e "${YELLOW}Running test backup...${NC}"
  cd "${PROJECT_DIR}"
  ${BACKUP_SCRIPT}
fi

exit 0
