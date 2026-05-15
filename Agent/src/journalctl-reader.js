/**
 * Journalctl Reader for systemd-based systems
 * Reads logs from systemd journal when traditional log files don't exist
 */

import { spawn } from 'child_process';

/**
 * Watch journalctl for new entries
 * @param {Array} units - systemd units to watch (e.g., ['ssh', 'sshd'])
 * @param {Function} callback - Called with each new log line
 */
export const watchJournalctl = (units, callback) => {
  // Build journalctl command
  // -f = follow (like tail -f)
  // -n 0 = start from now (don't show old logs)
  // -u = unit to watch
  const args = ['-f', '-n', '0'];
  
  // Add units to watch
  units.forEach(unit => {
    args.push('-u', unit);
  });

  console.log(`[JOURNALCTL] Watching units: ${units.join(', ')}`);

  const journal = spawn('journalctl', args);

  journal.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      callback(line);
    });
  });

  journal.stderr.on('data', (data) => {
    console.error(`[JOURNALCTL] Error: ${data}`);
  });

  journal.on('close', (code) => {
    console.log(`[JOURNALCTL] Process exited with code ${code}`);
    // Restart after 5 seconds
    setTimeout(() => {
      console.log('[JOURNALCTL] Restarting...');
      watchJournalctl(units, callback);
    }, 5000);
  });

  return journal;
};

/**
 * Check if system uses journalctl
 * @returns {boolean}
 */
export const hasJournalctl = () => {
  try {
    const { execSync } = require('child_process');
    execSync('which journalctl', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get recent logs from journalctl
 * @param {Array} units - systemd units
 * @param {number} lines - number of lines to get
 * @returns {Promise<Array>}
 */
export const getRecentJournalLogs = async (units, lines = 100) => {
  return new Promise((resolve, reject) => {
    const args = ['-n', lines.toString()];
    
    units.forEach(unit => {
      args.push('-u', unit);
    });

    const journal = spawn('journalctl', args);
    let output = '';

    journal.stdout.on('data', (data) => {
      output += data.toString();
    });

    journal.on('close', (code) => {
      if (code === 0) {
        const lines = output.split('\n').filter(Boolean);
        resolve(lines);
      } else {
        reject(new Error(`journalctl exited with code ${code}`));
      }
    });
  });
};
