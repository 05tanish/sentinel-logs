import { AsyncHandeler } from '../../utilis/Aysnchandler.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { upsertHeartbeat, getAgents } from './Agent.Service.js';

// POST /api/agent/heartbeat
export const heartbeat = AsyncHandeler(async (req, res) => {
  const { source, hostname, platform } = req.body;

  if (!source) {
    return res.status(400).json({ success: false, message: 'source is required' });
  }

  await upsertHeartbeat({ source, hostname: hostname || 'unknown', platform: platform || 'unknown' });

  return successResponse(res, { message: 'Heartbeat received' });
});

// GET /api/agent/status
export const getAgentStatus = AsyncHandeler(async (_req, res) => {
  const data = await getAgents();
  return successResponse(res, { message: 'Agent status fetched', data });
});
