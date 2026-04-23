import { AsyncHandeler } from '../../utilis/Aysnchandler.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { upsertHeartbeat, getAgents } from './Agent.Service.js';

// POST /api/agent/heartbeat
export const heartbeat = AsyncHandeler(async (req, res) => {
  const { source, hostname, platform } = req.body;

// use apperror
  if (!source) {
    return res.status(400).json({ success: false, message: 'source is required' });
  }

  await upsertHeartbeat({ source, hostname: hostname || 'unknown', platform: platform || 'unknown' });
// pass status code 
  return successResponse(res, { message: 'Heartbeat received' });
});

// GET /api/agent/status
export const getAgentStatus = AsyncHandeler(async (_req, res) => {
  const data = await getAgents();
  //pass status code also 
  return successResponse(res, { message: 'Agent status fetched', data });
});
