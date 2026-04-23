import { Router } from 'express';
import { downloadCSV, downloadPDF } from './Reports.Controller.js';
import { authenticate } from '../../middelware/Auth.js';
import { authorize } from '../../middelware/Role.js';

const router = Router();

router.get('/csv', authenticate, authorize('admin', 'analyst'), downloadCSV);
router.get('/pdf', authenticate, authorize('admin', 'analyst'), downloadPDF);

export default router;
