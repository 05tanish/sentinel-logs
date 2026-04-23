import { Router } from 'express';
import { getLogs, analyzeLogs, ingestLog, getLogsBySeverity, uploadLogs, upload } from './Logs.Controller.js';
import { authenticate } from '../../middelware/Auth.js';
import { authorize } from '../../middelware/Role.js';

const router = Router();

router.post('/logs', authenticate, ingestLog);
router.post('/logs/upload', authenticate, authorize('admin', 'analyst'), upload.single('logfile'), uploadLogs);
router.get('/logs', authenticate, getLogs);
router.get('/logs/severity/:severity', authenticate, getLogsBySeverity);
router.get('/analyze', authenticate, analyzeLogs);

export default router;
