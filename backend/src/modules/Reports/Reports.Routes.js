import { Router } from 'express';
import { downloadCSV, downloadPDF } from './Reports.Controller.js';
import { authenticate, authorize } from '../../middelware/Auth.js';

const router = Router();

router.get('/csv', authenticate, authorize('admin', 'analyst'), downloadCSV);
router.get('/pdf', authenticate, authorize('admin', 'analyst'), downloadPDF);

export default router;
