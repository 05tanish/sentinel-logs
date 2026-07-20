import { Router } from 'express';
import { getAlerts, getAlert, acknowledge, resolve, stats } from './Alerts.Controller.js';
import { authenticate, authorize } from '../../middelware/Auth.js';

const router = Router();

router.get('/', authenticate, getAlerts);
router.get('/stats', authenticate, stats);
router.get('/:id', authenticate, getAlert);
router.patch('/:id/acknowledge', authenticate, authorize('admin', 'analyst'), acknowledge);
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), resolve);

export default router;
