import { Router } from 'express';
import { login, changeUserPassword, adminResetPassword } from './Auth.Controller.js';
import { authenticate } from '../../middelware/Auth.js';
import { authorize } from '../../middelware/Role.js';

const router = Router();

router.post('/login', login);
router.put('/change-password', authenticate, changeUserPassword);
router.put('/reset-password', authenticate, authorize('admin'), adminResetPassword);

export default router;
