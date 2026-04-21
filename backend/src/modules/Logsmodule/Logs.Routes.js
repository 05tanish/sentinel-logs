import { Router } from 'express';
import { getLogs, analyzeLogs, ingestLog, getLogsBySeverity } from './Logs.Controller.js';
import { authenticate } from '../../middelware/Auth.js';

const router = Router();

router.post('/logs', authenticate, ingestLog);
router.get('/logs', authenticate, getLogs);
router.get('/logs/severity/:severity', authenticate, getLogsBySeverity);
router.get('/analyze', authenticate, analyzeLogs);

export default router;
