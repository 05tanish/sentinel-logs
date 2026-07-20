import { Router } from 'express';
import { login, changeUserPassword, adminResetPassword } from './Auth.Controller.js';
import { authenticate, authorize } from '../../middelware/Auth.js';

const router = Router();

router.post('/login', login);
router.put('/change-password', authenticate, changeUserPassword);
router.put('/reset-password', authenticate, authorize('admin'), adminResetPassword);

export default router;
