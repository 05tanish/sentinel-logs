import { AppError } from '../../utilis/ApiResponse.js';
import { AsyncHandeler } from '../../utilis/Aysnchandler.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { logSchema } from './Logs.Schema.js';
import { runRuleEngine } from './RuleEngine.js';

import {
  fetchLogs,
  fetchAndAnalyzeLogs,
  parseLog,
  storeLog,
  fetchLogsBySeverity,
} from './Logs.Service.js';

export const getLogs = AsyncHandeler(async (_req, res) => {
  const data = await fetchLogs();
  return successResponse(res, { message: 'Logs fetched', data });
});

export const analyzeLogs = AsyncHandeler(async (_req, res) => {
  const data = await fetchAndAnalyzeLogs();
  return successResponse(res, { message: 'Analysis complete', data });
});

export const ingestLog = AsyncHandeler(async (req, res) => {
  const parsed_input = logSchema.safeParse(req.body);
  if (!parsed_input.success) {
    throw new AppError(400, 'Validation failed', parsed_input.error.errors);
  }

  const { raw, source, timestamp } = parsed_input.data;
  const parsed = parseLog(raw);
  const log = await storeLog({ raw, source, timestamp, parsed });

  // run rule engine async — don't block the response
  runRuleEngine(parsed).catch(console.error);

  return successResponse(res, {
    statusCode: 201,
    message: 'Log ingested',
    data: { id: log.id, event_type: parsed.event_type, severity: parsed.severity },
  });
});

export const getLogsBySeverity = AsyncHandeler(async (req, res) => {
  const { severity } = req.params;
  const data = await fetchLogsBySeverity(severity);
  return successResponse(res, { message: `Logs with severity ${severity} fetched`, data });
});