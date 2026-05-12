import { Router } from 'express';
import { heartbeat, getAgentStatus } from './Agent.Controller.js';
import { authenticate, authenticateAgent } from '../../middelware/Auth.js';
import { authorize } from '../../middelware/Role.js';

const router = Router();

router.post('/heartbeat', authenticateAgent, heartbeat);
router.get('/status', authenticate, authorize('admin', 'analyst'), getAgentStatus);

export default router;
