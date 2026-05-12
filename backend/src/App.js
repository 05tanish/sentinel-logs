import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errorHandler, notFoundHandler, asyncHandler } from './middelware/ErrorMiddelware.js';
import { metricsMiddleware, metricsEndpoint } from './middelware/metrics.js';
import { checkDBHealth } from './config/db.js';
import pool from './config/db.js';
import authRoutes from './modules/Auth/Auth.Routes.js';
import logsRoutes from './modules/Logsmodule/Logs.Routes.js';
import alertsRoutes from './modules/Alerts/Alerts.Routes.js';
import usersRoutes from './modules/Users/Users.Routes.js';
import agentRoutes from './modules/Agent/Agent.Routes.js';
import reportsRoutes from './modules/Reports/Reports.Routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();

// Security middleware - must be first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.LOKI_URL || "http://loki:3100"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow Grafana embedding
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS) || 1);

// CORS configuration with enhanced security
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log unauthorized CORS attempts
    console.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Body parsing with size limits and validation
app.use(express.json({
  limit: process.env.JSON_LIMIT || '10kb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification if needed
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: process.env.URL_ENCODED_LIMIT || '10kb'
}));

// Prometheus metrics middleware (before routes)
app.use(metricsMiddleware);

// Enhanced rate limiting with different tiers
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // Use default key generator which properly handles IPv6
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const strictLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many attempts. Try again in 15 minutes.');
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts.');
const apiLimiter = createRateLimiter(60 * 1000, 100, 'API rate limit exceeded.');
const logLimiter = createRateLimiter(60 * 1000, 1000, 'Log ingestion rate limit exceeded.');

// Security headers middleware
app.use((req, res, next) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add request ID for tracing
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    };
    
    // Log slow requests or errors
    if (duration > 1000 || res.statusCode >= 400) {
      console.warn('Request log:', JSON.stringify(logData));
    }
  });
  
  next();
});

// Prometheus metrics endpoint (before rate limiting)
app.get('/metrics', metricsEndpoint);

// Health check endpoint (before rate limiting)
const healthHandler = asyncHandler(async (req, res) => {
  const dbHealth = await checkDBHealth();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Apply rate limiting to API routes
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/logs', logLimiter);
// Don't apply general apiLimiter to /api/logs (it has its own limiter)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/logs')) {
    return next(); // Skip general limiter for logs
  }
  return apiLimiter(req, res, next);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', logsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/reports', reportsRoutes);

// Admin endpoints with extra security
app.get('/api/admin/errors', asyncHandler(async (req, res) => {
  // This would require admin role check
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  const errors = await pool.query(
    'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 100'
  );
  
  res.json({ success: true, data: errors.rows });
}));

// Serve frontend production build (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../frontend/dist'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
}

// 404 handler for API routes - use middleware instead of route
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return notFoundHandler(req, res, next);
  }
  next();
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  const server = app.listen();
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    import('./config/db.js').then(({ closeDB }) => {
      closeDB().finally(() => {
        console.log('Graceful shutdown completed');
        process.exit(0);
      });
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
