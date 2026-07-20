import { Router } from 'express';
import { addUser, listUsers, deactivate, activate } from './Users.Controller.js';
import { authenticate, authorize } from '../../middelware/Auth.js';

const router = Router();

// all routes — admin only
router.post('/', authenticate, authorize('admin'), addUser);
router.get('/', authenticate, authorize('admin'), listUsers);
router.patch('/:id/deactivate', authenticate, authorize('admin'), deactivate);
router.patch('/:id/activate', authenticate, authorize('admin'), activate);

export default router;
