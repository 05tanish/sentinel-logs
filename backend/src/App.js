import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler } from './middelware/ErrorMiddelware.js';
import authRoutes from './modules/Auth/Auth.Routes.js';
import logsRoutes from './modules/Logsmodule/Logs.Routes.js';
import alertsRoutes from './modules/Alerts/Alerts.Routes.js';
import usersRoutes from './modules/Users/Users.Routes.js';
import agentRoutes from './modules/Agent/Agent.Routes.js';
import reportsRoutes from './modules/Reports/Reports.Routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();

// CORS — read origins from env for production flexibility
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' })); // reject bodies over 10kb

// Rate limiting — login: 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting — log ingestion: 500 per minute per IP
const logLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { success: false, message: 'Log ingestion rate limit exceeded.' },
});

// API routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logLimiter);
app.use('/api', logsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK' }));

// Serve frontend production build
app.use(express.static(join(__dirname, '../../frontend/dist')));

// Fallback for React Router
app.get('/{*path}', (_req, res) => {
  res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
});

// Global error handler — must be last
app.use(errorHandler);
