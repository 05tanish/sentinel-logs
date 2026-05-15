#!/usr/bin/env node

/**
 * Agent Connectivity Diagnostic Tool
 * Tests connection to SIEM backend and reports issues
 */

import axios from 'axios';
import https from 'https';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CONFIG_PATH = join(homedir(), '.siem-agent', 'config.json');
const PENDING_PATH = join(homedir(), '.siem-agent', 'pending-logs.json');

console.log('🔍 SIEM Agent Connectivity Diagnostic\n');
console.log('═'.repeat(50));

// Load config
let config;
try {
  if (!existsSync(CONFIG_PATH)) {
    console.error('❌ Config file not found:', CONFIG_PATH);
    console.error('   Run: siem-agent init');
    process.exit(1);
  }
  config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  console.log('✓ Config loaded');
  
  // Handle both siemUrl and backendUrl for compatibility
  const backendUrl = config.backendUrl || config.siemUrl;
  if (!backendUrl) {
    console.error('❌ No backend URL found in config');
    console.error('   Config should have "backendUrl" or "siemUrl"');
    process.exit(1);
  }
  
  console.log(`  Backend URL: ${backendUrl}`);
  console.log(`  Agent Name: ${config.agentName || config.source || 'unknown'}`);
  console.log(`  API Key: ${config.apiKey.substring(0, 10)}...`);
  
  // Normalize config for rest of script
  config.backendUrl = backendUrl;
  config.source = config.source || config.agentName || 'unknown';
} catch (err) {
  console.error('❌ Failed to load config:', err.message);
  process.exit(1);
}

console.log('\n' + '═'.repeat(50));

// Extract hostname/IP from URL
const backendUrl = config.backendUrl;
const urlMatch = backendUrl.match(/^https?:\/\/([^:\/]+)/);
const backendHost = urlMatch ? urlMatch[1] : null;

if (!backendHost) {
  console.error('❌ Invalid backend URL:', backendUrl);
  process.exit(1);
}

console.log('\n📡 Network Tests\n');

// Test 1: Ping
console.log('Test 1: Ping backend host');
try {
  const { stdout } = await execAsync(`ping -c 3 ${backendHost}`);
  const match = stdout.match(/(\d+)% packet loss/);
  const loss = match ? parseInt(match[1]) : 100;
  
  if (loss === 0) {
    console.log('  ✓ Host is reachable (0% packet loss)');
  } else if (loss < 100) {
    console.log(`  ⚠️  Host partially reachable (${loss}% packet loss)`);
  } else {
    console.log('  ❌ Host unreachable (100% packet loss)');
  }
} catch (err) {
  console.log('  ❌ Ping failed:', err.message);
}

// Test 2: Port connectivity
console.log('\nTest 2: Port connectivity');
const port = backendUrl.startsWith('https') ? 443 : 80;
try {
  const { stdout } = await execAsync(`nc -zv ${backendHost} ${port} 2>&1`);
  if (stdout.includes('succeeded') || stdout.includes('open')) {
    console.log(`  ✓ Port ${port} is open`);
  } else {
    console.log(`  ❌ Port ${port} is closed or filtered`);
  }
} catch (err) {
  console.log(`  ❌ Port ${port} test failed:`, err.message);
  console.log('     Firewall may be blocking connection');
}

console.log('\n' + '═'.repeat(50));
console.log('\n🔌 Backend API Tests\n');

const httpClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 5000,
  headers: { 'x-api-key': config.apiKey },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Test 3: Health endpoint
console.log('Test 3: Health endpoint');
try {
  const response = await httpClient.get('/health');
  if (response.status === 200) {
    console.log('  ✓ Backend is online');
    console.log('  Response:', JSON.stringify(response.data));
  } else {
    console.log(`  ⚠️  Unexpected status: ${response.status}`);
  }
} catch (err) {
  console.log('  ❌ Health check failed');
  console.log('  Error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('  → Backend is not running or not accessible');
  } else if (err.code === 'ETIMEDOUT') {
    console.log('  → Connection timeout - firewall or network issue');
  } else if (err.code === 'ENOTFOUND') {
    console.log('  → Hostname not found - check DNS or use IP address');
  }
}

// Test 4: Heartbeat endpoint
console.log('\nTest 4: Heartbeat endpoint (with authentication)');
try {
  const response = await httpClient.post('/api/agent/heartbeat', {
    source: config.source,
    hostname: 'diagnostic-test',
    platform: process.platform,
    status: 'testing'
  });
  
  if (response.status === 200) {
    console.log('  ✓ Heartbeat successful');
    console.log('  Authentication: OK');
  } else {
    console.log(`  ⚠️  Unexpected status: ${response.status}`);
  }
} catch (err) {
  console.log('  ❌ Heartbeat failed');
  console.log('  Error:', err.message);
  if (err.response?.status === 401) {
    console.log('  → API key is invalid');
    console.log('  → Check AGENT_API_KEY in backend .env matches agent config');
  }
}

// Test 5: Log ingestion endpoint
console.log('\nTest 5: Log ingestion endpoint');
try {
  const response = await httpClient.post('/api/logs', {
    raw: 'Diagnostic test log from agent',
    source: config.source
  });
  
  if (response.status === 200 || response.status === 201) {
    console.log('  ✓ Log ingestion successful');
    console.log('  Agent can send logs to backend');
  } else {
    console.log(`  ⚠️  Unexpected status: ${response.status}`);
  }
} catch (err) {
  console.log('  ❌ Log ingestion failed');
  console.log('  Error:', err.message);
  if (err.response?.status === 401) {
    console.log('  → API key is invalid');
  }
}

console.log('\n' + '═'.repeat(50));
console.log('\n📊 Agent Status\n');

// Check pending logs
if (existsSync(PENDING_PATH)) {
  const content = readFileSync(PENDING_PATH, 'utf8').trim();
  const pendingCount = content ? content.split('\n').length : 0;
  
  if (pendingCount === 0) {
    console.log('✓ No pending logs (all logs sent successfully)');
  } else {
    console.log(`⚠️  ${pendingCount} pending logs waiting to be sent`);
    console.log(`   Location: ${PENDING_PATH}`);
    console.log('   These will be sent when backend comes online');
  }
} else {
  console.log('✓ No pending logs file (agent never went offline)');
}

// Check if agent service is running
console.log('\nAgent Service Status:');
try {
  const { stdout } = await execAsync('systemctl is-active siem-agent 2>&1');
  if (stdout.trim() === 'active') {
    console.log('  ✓ Agent service is running');
  } else {
    console.log('  ❌ Agent service is not running');
    console.log('     Start with: sudo systemctl start siem-agent');
  }
} catch (err) {
  console.log('  ℹ️  Could not check service status (may not be installed)');
}

console.log('\n' + '═'.repeat(50));
console.log('\n📋 Summary\n');

console.log('Configuration:');
console.log(`  Backend URL: ${config.backendUrl}`);
console.log(`  Agent Name: ${config.source}`);
console.log(`  Log Sources: ${config.logSources?.length || config.logPaths?.length || 0}`);

console.log('\nNext Steps:');
console.log('  1. If health check failed: Check backend is running');
console.log('  2. If port test failed: Check firewall settings');
console.log('  3. If auth failed: Verify API key matches backend .env');
console.log('  4. If hostname not found: Use IP address instead');

console.log('\nFor detailed troubleshooting, see:');
console.log('  AGENT_CONNECTIVITY_GUIDE.md');

console.log('\n' + '═'.repeat(50));
