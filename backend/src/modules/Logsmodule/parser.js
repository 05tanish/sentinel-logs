// ─── Format 1: JSON structured logs ─────────────────────
// {"level":"error","ip":"192.168.1.1","userId":"admin","message":"Login failed"}
const parseJSON = (raw) => {
  try {
    const log = JSON.parse(raw);
    if (typeof log !== 'object' || Array.isArray(log)) return null;

    const message = (log.message || log.msg || '').toLowerCase();
    const failedLogin = /failed|failure|invalid|unauthorized/i.test(message);
    const successLogin = /success|accepted|logged in/i.test(message);

    return {
      ip_address: log.ip || log.clientIp || log.remoteAddr || log.remote_addr || null,
      username: log.userId || log.username || log.user || log.account || null,
      event_type: failedLogin ? 'FAILED_LOGIN' : successLogin ? 'SUCCESSFUL_LOGIN' : 'GENERAL',
      severity: log.level === 'error' || log.level === 'warn' || failedLogin ? 'HIGH' : 'LOW',
      format: 'json',
    };
  } catch {
    return null;
  }
};

// ─── Format 2: Linux syslog / auth.log ───────────────────
// "Apr 22 10:00:01 server sshd[1234]: Failed password for admin from 192.168.1.1 port 22"
// "Apr 22 10:00:01 server sudo: admin : TTY=pts/0 ; USER=root ; COMMAND=/bin/bash"
const parseSyslog = (raw) => {
  // must match syslog timestamp pattern
  const syslogPattern = /^\w{3}\s+\d+\s+[\d:]+\s+\S+\s+\S+/;
  if (!syslogPattern.test(raw)) return null;

  const ipMatch = raw.match(/from\s+([\d.]+)/i);
  const userMatch = raw.match(/(?:for invalid user|for user|for)\s+(\w+)/i)
    || raw.match(/user[=:\s]+(\w+)/i);

  const failedLogin = /failed password|authentication failure|invalid user|failed login/i.test(raw);
  const successLogin = /accepted password|session opened|logged in/i.test(raw);
  const privEsc = /sudo:|su\[|COMMAND=/i.test(raw);

  let event_type = 'GENERAL';
  let severity = 'LOW';

  if (failedLogin) { event_type = 'FAILED_LOGIN'; severity = 'HIGH'; }
  else if (successLogin) { event_type = 'SUCCESSFUL_LOGIN'; severity = 'LOW'; }
  else if (privEsc) { event_type = 'PRIVILEGE_ESCALATION'; severity = 'CRITICAL'; }

  return {
    ip_address: ipMatch?.[1] || null,
    username: userMatch?.[1] || null,
    event_type,
    severity,
    format: 'syslog',
  };
};

// ─── Format 3: Nginx / Apache access log ─────────────────
// "192.168.1.1 - admin [22/Apr/2026:10:00:01 +0000] "GET /admin HTTP/1.1" 401 512"
const parseNginx = (raw) => {
  const match = raw.match(
    /^([\d.]+)\s+-\s+(\S+)\s+\[[^\]]+\]\s+"(\w+)\s+([^\s"]+)[^"]*"\s+(\d{3})/
  );
  if (!match) return null;

  const statusCode = parseInt(match[5]);
  const isUnauthorized = statusCode === 401 || statusCode === 403;
  const isError = statusCode >= 400;

  return {
    ip_address: match[1],
    username: match[2] !== '-' ? match[2] : null,
    event_type: isUnauthorized ? 'FAILED_LOGIN' : isError ? 'HTTP_ERROR' : 'HTTP_REQUEST',
    severity: isUnauthorized ? 'HIGH' : isError ? 'MEDIUM' : 'LOW',
    format: 'nginx',
    method: match[3],
    path: match[4],
    status_code: statusCode,
  };
};

// ─── Format 4: Windows Event Log ─────────────────────────
// "An account failed to log on. Account Name: admin Source Network Address: 192.168.1.1"
// "Audit Failure: Logon Type: 3 Account Name: SYSTEM"
const parseWindows = (raw) => {
  if (!/account failed|logon failure|audit failure|an account/i.test(raw)) return null;

  const userMatch = raw.match(/Account Name:\s*(\S+)/i);
  const ipMatch = raw.match(/(?:Source Network Address|Workstation):\s*([\d.]+)/i);
  const successMatch = /account was successfully logged on|logon success/i.test(raw);

  return {
    ip_address: ipMatch?.[1] || null,
    username: userMatch?.[1] || null,
    event_type: successMatch ? 'SUCCESSFUL_LOGIN' : 'FAILED_LOGIN',
    severity: successMatch ? 'LOW' : 'HIGH',
    format: 'windows',
  };
};

// ─── Format 5: UFW / Firewall logs ───────────────────────
// "Apr 22 10:00:01 server kernel: [UFW BLOCK] IN=eth0 SRC=192.168.1.1 DPT=22"
const parseFirewall = (raw) => {
  if (!/UFW|IPTABLES|FIREWALL|BLOCK|DROP/i.test(raw)) return null;

  const srcMatch = raw.match(/SRC=([\d.]+)/i);
  const dstPortMatch = raw.match(/DPT=(\d+)/i);
  const blocked = /BLOCK|DROP|DENY/i.test(raw);

  return {
    ip_address: srcMatch?.[1] || null,
    username: null,
    event_type: blocked ? 'FIREWALL_BLOCK' : 'FIREWALL_ALLOW',
    severity: blocked ? 'MEDIUM' : 'LOW',
    format: 'firewall',
    port: dstPortMatch?.[1] || null,
  };
};

// ─── Fallback: generic regex ─────────────────────────────
const parseGeneric = (raw) => {
  const ipMatch = raw.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  const userMatch = raw.match(/user[:\s]+(\w+)/i);
  const failedLogin = /failed login|login failed|authentication failed/i.test(raw);
  const successLogin = /successful login|login successful|authenticated/i.test(raw);

  return {
    ip_address: ipMatch?.[0] || null,
    username: userMatch?.[1] || null,
    event_type: failedLogin ? 'FAILED_LOGIN' : successLogin ? 'SUCCESSFUL_LOGIN' : 'GENERAL',
    severity: failedLogin ? 'HIGH' : 'LOW',
    format: 'generic',
  };
};

// ─── Main parser — cascading format detection ─────────────
export const parseLog = (raw) => {
  if (!raw?.trim()) return parseGeneric('');

  // try each format in order — first match wins
  return (
    parseJSON(raw)     ||  // structured JSON logs
    parseSyslog(raw)   ||  // Linux syslog / auth.log
    parseNginx(raw)    ||  // Nginx / Apache access logs
    parseWindows(raw)  ||  // Windows Event Log
    parseFirewall(raw) ||  // UFW / firewall logs
    parseGeneric(raw)      // fallback
  );
};
