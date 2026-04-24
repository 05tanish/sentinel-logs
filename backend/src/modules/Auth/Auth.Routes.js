import { Router } from 'express';
import { login, changeUserPassword, adminResetPassword } from './Auth.Controller.js';
import { authenticateToken } from '../../middelware/Auth.js';
import { requireRole } from '../../middelware/Role.js';

const router = Router();

router.post('/login', login);
router.put('/change-password', authenticateToken, changeUserPassword);
router.put('/reset-password', authenticateToken, requireRole(['admin']), adminResetPassword);

export default router;
