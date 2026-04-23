import dgram from 'dgram';
import { parseLog } from './modules/Logsmodule/parser.js';
import { storeLog } from './modules/Logsmodule/Logs.Service.js';
import { runRuleEngine } from './modules/Logsmodule/RuleEngine.js';
import { logger } from './utilis/Logger.js';

const SYSLOG_PORT = process.env.SYSLOG_PORT || 514;

// strip syslog priority prefix <34> from message
const stripPriority = (raw) => raw.replace(/^<\d+>/, '').trim();

export const startSyslogServer = () => {
  const server = dgram.createSocket('udp4');

  server.on('message', async (msg, rinfo) => {
    try {
      const raw = stripPriority(msg.toString().trim());
      if (!raw) return;

      const parsed = parseLog(raw);

      // use sender IP if log didn't contain one
      if (!parsed.ip_address) {
        parsed.ip_address = rinfo.address;
      }

      await storeLog({
        raw,
        source: `syslog:${rinfo.address}`,
        parsed,
      });

      // run rule engine async — don't block UDP receiver
      runRuleEngine(parsed).catch(console.error);

    } catch (err) {
      logger.error('Syslog processing error', { error: err.message, sender: rinfo.address });
    }
  });

  server.on('error', (err) => {
    logger.error('Syslog UDP server error', { error: err.message });
    server.close();
  });

  server.bind(SYSLOG_PORT, () => {
    console.log(`Syslog UDP server listening on port ${SYSLOG_PORT}`);
  });

  return server;
};
