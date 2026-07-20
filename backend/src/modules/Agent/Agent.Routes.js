import { Router } from 'express';
import { heartbeat, getAgentStatus } from './Agent.Controller.js';
import { authenticate, authenticateAgent, authorize } from '../../middelware/Auth.js';

const router = Router();

router.post('/heartbeat', authenticateAgent, heartbeat);
router.get('/status', authenticate, authorize('admin', 'analyst'), getAgentStatus);

export default router;
