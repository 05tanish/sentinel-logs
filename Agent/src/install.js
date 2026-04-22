import os from 'os';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const AGENT_BIN = process.execPath.replace('node', '') + 'siem-agent';

// ─── Linux — systemd ──────────────────────────────────────
const installLinux = () => {
  const serviceContent = `[Unit]
Description=SIEM Security Agent
Documentation=https://github.com/your-username/siem-project
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${AGENT_BIN}
Restart=always
RestartSec=3
User=root
StandardOutput=journal
StandardError=journal
SyslogIdentifier=siem-agent

[Install]
WantedBy=multi-user.target
`;

  const servicePath = '/etc/systemd/system/siem-agent.service';

  try {
    writeFileSync(servicePath, serviceContent);
    execSync('systemctl daemon-reload');
    execSync('systemctl enable siem-agent');
    execSync('systemctl start siem-agent');
    console.log('✅ systemd service installed and started');
    console.log('   Check status: systemctl status siem-agent');
    console.log('   View logs:    journalctl -u siem-agent -f');
    console.log('   Stop:         sudo systemctl stop siem-agent');
  } catch (err) {
    console.error('❌ Failed to install systemd service:', err.message);
    console.error('   Make sure you run: sudo siem-agent install');
  }
};

// ─── macOS — launchd ─────────────────────────────────────
const installMac = () => {
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.siem.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>${AGENT_BIN}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/var/log/siem-agent.log</string>
  <key>StandardErrorPath</key>
  <string>/var/log/siem-agent-error.log</string>
</dict>
</plist>
`;

  const plistPath = '/Library/LaunchDaemons/com.siem.agent.plist';

  try {
    writeFileSync(plistPath, plistContent);
    execSync(`launchctl load ${plistPath}`);
    console.log('✅ launchd service installed and started');
    console.log('   Check status: launchctl list | grep siem');
    console.log('   View logs:    tail -f /var/log/siem-agent.log');
    console.log('   Stop:         sudo launchctl unload ' + plistPath);
  } catch (err) {
    console.error('❌ Failed to install launchd service:', err.message);
    console.error('   Make sure you run: sudo siem-agent install');
  }
};

// ─── Windows — Windows Service ────────────────────────────
const installWindows = () => {
  try {
    // check if node-windows is available
    execSync('node -e "require(\'node-windows\')"', { stdio: 'ignore' });
  } catch {
    console.log('Installing node-windows...');
    execSync('npm install -g node-windows', { stdio: 'inherit' });
  }

  const scriptContent = `
const Service = require('node-windows').Service;
const svc = new Service({
  name: 'SIEM Agent',
  description: 'SIEM Security Log Collection Agent',
  script: '${AGENT_BIN}',
  nodeOptions: [],
  wait: 2,
  grow: 0.5
});
svc.on('install', () => { svc.start(); console.log('Service installed and started'); });
svc.install();
`;

  const tmpScript = join(os.tmpdir(), 'siem-install.js');
  writeFileSync(tmpScript, scriptContent);

  try {
    execSync(`node ${tmpScript}`, { stdio: 'inherit' });
    console.log('✅ Windows Service installed');
    console.log('   Check status: sc query "SIEM Agent"');
    console.log('   Stop:         sc stop "SIEM Agent"');
  } catch (err) {
    console.error('❌ Failed to install Windows service:', err.message);
    console.error('   Make sure you run as Administrator');
  }
};

// ─── Uninstall ────────────────────────────────────────────
export const uninstall = () => {
  const platform = os.platform();
  try {
    if (platform === 'linux') {
      execSync('systemctl stop siem-agent');
      execSync('systemctl disable siem-agent');
      execSync('rm /etc/systemd/system/siem-agent.service');
      execSync('systemctl daemon-reload');
      console.log('✅ systemd service removed');
    } else if (platform === 'darwin') {
      execSync('launchctl unload /Library/LaunchDaemons/com.siem.agent.plist');
      execSync('rm /Library/LaunchDaemons/com.siem.agent.plist');
      console.log('✅ launchd service removed');
    } else if (platform === 'win32') {
      execSync('sc stop "SIEM Agent"');
      execSync('sc delete "SIEM Agent"');
      console.log('✅ Windows service removed');
    }
  } catch (err) {
    console.error('❌ Uninstall failed:', err.message);
  }
};

// ─── Main install ─────────────────────────────────────────
export const install = () => {
  const platform = os.platform();
  console.log(`\nDetected OS: ${platform}`);
  console.log('Installing SIEM Agent as system service...\n');

  if (platform === 'linux') installLinux();
  else if (platform === 'darwin') installMac();
  else if (platform === 'win32') installWindows();
  else {
    console.error(`❌ Unsupported platform: ${platform}`);
    console.error('   Supported: linux, darwin (macOS), win32 (Windows)');
    process.exit(1);
  }
};
