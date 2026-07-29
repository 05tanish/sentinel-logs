import { unlinkSync } from 'fs';
import multer from 'multer';
import { AppError } from '../../utilis/ApiResponse.js';
import { asyncHandler } from '../../middelware/ErrorMiddelware.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { logSchema } from './Logs.Schema.js';
import { runRuleEngine } from './RuleEngine.js';
import {
  fetchLogs,
  fetchAndAnalyzeLogs,
  parseLog,
  storeLog,
  fetchLogsBySeverity,
  processLogFile,
} from './Logs.Service.js';

// multer config — store in /tmp, max 50MB, only text files
export const upload = multer({
  dest: '/tmp/siem-uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'application/octet-stream', 'text/x-log'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.log')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only .log and .txt files are allowed'));
    }
  },
});

export const getLogs = asyncHandler(async (_req, res) => {
  const data = await fetchLogs();
  return successResponse(res, { message: 'Logs fetched', data });
});

export const analyzeLogs = asyncHandler(async (_req, res) => {
  const data = await fetchAndAnalyzeLogs();
  return successResponse(res, { message: 'Analysis complete', data });
});

export const ingestLog = asyncHandler(async (req, res) => {
  const parsed_input = logSchema.safeParse(req.body);
  if (!parsed_input.success) {
    throw new AppError(400, 'Validation failed', parsed_input.error.errors);
  }

  const { raw, source, timestamp } = parsed_input.data;
  const parsed = parseLog(raw);
  const log = await storeLog({ raw, source, timestamp, parsed });

  runRuleEngine(parsed).catch(console.error);

  return successResponse(res, {
    statusCode: 201,
    message: 'Log ingested',
    data: { id: log.id, event_type: parsed.event_type, severity: parsed.severity },
  });
});

export const getLogsBySeverity = asyncHandler(async (req, res) => {
  const { severity } = req.params;
  const { limit, offset } = req.query;
  const data = await fetchLogsBySeverity(severity, limit, offset);
  return successResponse(res, { message: `Logs with severity ${severity} fetched`, data });
});

// POST /api/logs/upload — file upload from USB or local machine
export const uploadLogs = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'No file uploaded');
  }

  const source = req.body.source || `file-upload:${req.file.originalname}`;

  try {
    const result = await processLogFile(req.file.path, source);

    return successResponse(res, {
      statusCode: 201,
      message: `File processed successfully`,
      data: {
        filename: req.file.originalname,
        processed: result.processed,
        errors: result.errors,
        source,
      },
    });
  } finally {
    // always delete temp file after processing
    try { unlinkSync(req.file.path); } catch { /* ignore */ }
  }
});
