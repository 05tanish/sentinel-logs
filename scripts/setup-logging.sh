#!/bin/bash

################################################################################
# SIEM Agent Logging Setup Script
# 
# Purpose: Automatically detects and configures logging systems for SIEM agent
# Supports: systemd/journalctl and traditional syslog-based systems
# 
# Usage: sudo bash setup-logging.sh
################################################################################

set -e

echo "🔧 SIEM Agent Logging Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Error: This script must be run as root${NC}"
  echo "Usage: sudo bash setup-logging.sh"
  exit 1
fi

# Detect system type
echo "Detecting system configuration..."
echo ""

# Check if journalctl exists
if command -v journalctl &> /dev/null; then
  echo -e "${GREEN}✓ System uses systemd/journalctl${NC}"
  HAS_JOURNALCTL=true
else
  echo -e "${YELLOW}✗ System does not use journalctl${NC}"
  HAS_JOURNALCTL=false
fi

# Check if traditional log files exist
if [ -f "/var/log/auth.log" ]; then
  echo -e "${GREEN}✓ Traditional auth.log exists${NC}"
  HAS_AUTH_LOG=true
else
  echo -e "${YELLOW}✗ Traditional auth.log does not exist${NC}"
  HAS_AUTH_LOG=false
fi

echo ""
echo "============================"
echo ""

# Scenario 1: Has journalctl but no auth.log (modern systems)
if [ "$HAS_JOURNALCTL" = true ] && [ "$HAS_AUTH_LOG" = false ]; then
  echo -e "${YELLOW}Detected: Modern systemd-based system${NC}"
  echo "Recommendation: Install rsyslog to enable traditional log file monitoring"
  echo ""
  
  read -p "Install rsyslog? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing rsyslog..."
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
      apt-get update -qq
      apt-get install -y rsyslog
    elif command -v yum &> /dev/null; then
      yum install -y rsyslog
    elif command -v dnf &> /dev/null; then
      dnf install -y rsyslog
    else
      echo -e "${RED}Could not detect package manager${NC}"
      exit 1
    fi
    
    # Start and enable rsyslog
    systemctl start rsyslog
    systemctl enable rsyslog
    
    echo -e "${GREEN}✓ rsyslog installed and started${NC}"
    echo ""
    
    # Wait a moment for rsyslog to create files
    sleep 2
    
    # Check if auth.log was created
    if [ -f "/var/log/auth.log" ]; then
      echo -e "${GREEN}✓ /var/log/auth.log created${NC}"
    else
      echo -e "${YELLOW}⚠ /var/log/auth.log not created yet${NC}"
      echo "  It will be created when first log entry is written"
    fi
  fi
fi

# Scenario 2: Has both journalctl and traditional logs
if [ "$HAS_JOURNALCTL" = true ] && [ "$HAS_AUTH_LOG" = true ]; then
  echo -e "${GREEN}✓ System has both journalctl and traditional logs${NC}"
  echo "  Configuration: Optimal for SIEM monitoring"
fi

# Scenario 3: Only traditional logs
if [ "$HAS_JOURNALCTL" = false ] && [ "$HAS_AUTH_LOG" = true ]; then
  echo -e "${GREEN}✓ System uses traditional syslog-based logging${NC}"
  echo "  Configuration: Compatible with SIEM agent"
fi

# Scenario 4: No logging system detected
if [ "$HAS_JOURNALCTL" = false ] && [ "$HAS_AUTH_LOG" = false ]; then
  echo -e "${RED}✗ No logging system detected${NC}"
  echo "  Action required: Install rsyslog or syslog-ng"
  exit 1
fi

echo ""
echo "============================"
echo ""
echo "📋 Recommended SIEM Agent Configuration"
echo ""
echo "Copy this configuration to your agent's config file:"
echo ""

# Determine which log files to watch
LOG_FILES=()

if [ -f "/var/log/auth.log" ]; then
  LOG_FILES+=("/var/log/auth.log")
fi

if [ -f "/var/log/syslog" ]; then
  LOG_FILES+=("/var/log/syslog")
fi

if [ -f "/var/log/secure" ]; then
  LOG_FILES+=("/var/log/secure")
fi

if [ -f "/var/log/messages" ]; then
  LOG_FILES+=("/var/log/messages")
fi

# Generate config
echo "{"
echo '  "backendUrl": "https://YOUR_BACKEND_IP",'
echo '  "apiKey": "YOUR_API_KEY",'
echo '  "logPaths": ['

for i in "${!LOG_FILES[@]}"; do
  if [ $i -eq $((${#LOG_FILES[@]} - 1)) ]; then
    echo "    \"${LOG_FILES[$i]}\""
  else
    echo "    \"${LOG_FILES[$i]}\","
  fi
done

echo '  ],'
echo '  "source": "YOUR_AGENT_NAME",'
echo '  "retryInterval": 30000'
echo "}"

echo ""
echo "============================"
echo ""
echo "✅ Logging Setup Complete"
echo ""
echo "Next Steps:"
echo "  1. Copy the configuration above to your agent config file"
echo "  2. Replace YOUR_BACKEND_IP with your SIEM backend IP address"
echo "  3. Replace YOUR_API_KEY with your agent API key"
echo "  4. Replace YOUR_AGENT_NAME with a unique identifier"
echo "  5. Start the agent: siem-agent start"
echo ""

# Optional: Test log generation
echo "🧪 Optional: Verify Logging Configuration"
read -p "Generate a test log entry to verify setup? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Generating test authentication log entry..."
  
  # Generate a test SSH connection attempt (will fail and create log entry)
  timeout 2 ssh testuser@localhost 2>&1 | head -1 || true
  
  sleep 1
  
  echo ""
  echo "Recent log entries:"
  echo ""
  
  if [ -f "/var/log/auth.log" ]; then
    echo "From /var/log/auth.log:"
    tail -5 /var/log/auth.log
  fi
  
  if [ "$HAS_JOURNALCTL" = true ]; then
    echo ""
    echo "From systemd journal (SSH service):"
    journalctl -u ssh -n 5 --no-pager 2>/dev/null || journalctl -u sshd -n 5 --no-pager 2>/dev/null || echo "SSH service logs not available"
  fi
fi

echo ""
echo "Setup script completed successfully!"
