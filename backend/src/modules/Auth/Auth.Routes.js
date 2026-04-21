import { Router } from 'express';
import { login } from './Auth.Controller.js';

const router = Router();

router.post('/login', login);

export default router;
