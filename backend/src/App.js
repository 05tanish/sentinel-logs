import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middelware/ErrorMiddelware.js';
import authRoutes from './modules/Auth/Auth.Routes.js';
import logsRoutes from './modules/Logsmodule/Logs.Routes.js';
import alertsRoutes from './modules/Alerts/Alerts.Routes.js';

dotenv.config();

export const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', logsRoutes);
app.use('/api/alerts', alertsRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK' }));

// Global error handler — must be last
app.use(errorHandler);
