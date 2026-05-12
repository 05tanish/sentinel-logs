import promClient from 'prom-client';

// Enable default Node.js metrics
promClient.collectDefaultMetrics({
    timeout: 5000,
    prefix: 'siem_nodejs_',
});

// Create registry for custom metrics
const register = new promClient.Registry();
register.setDefaultLabels({
    app: 'siem-backend',
    version: process.env.npm_package_version || '1.0.0'
});

promClient.register.setDefaultLabels({
    app: 'siem-backend'
});

// HTTP request metrics
const httpRequestsTotal = new promClient.Counter({
    name: 'siem_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
    name: 'siem_http_request_duration_ms',
    help: 'Duration of HTTP requests in milliseconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000],
    registers: [register]
});

const activeConnections = new promClient.Gauge({
    name: 'siem_http_active_connections',
    help: 'Number of active HTTP connections',
    registers: [register]
});

// Database metrics
const databaseQueriesTotal = new promClient.Counter({
    name: 'siem_database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table', 'status'],
    registers: [register]
});

const dbQueryDuration = new promClient.Histogram({
    name: 'siem_database_query_duration_ms',
    help: 'Duration of database queries in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [register]
});

const dbPoolConnections = new promClient.Gauge({
    name: 'siem_database_pool_connections',
    help: 'Database connection pool status',
    labelNames: ['status'],
    registers: [register]
});

// SIEM-specific metrics
const logsIngestedTotal = new promClient.Counter({
    name: 'siem_logs_ingested_total',
    help: 'Total number of logs ingested',
    labelNames: ['source', 'severity'],
    registers: [register]
});

const alertsGeneratedTotal = new promClient.Counter({
    name: 'siem_alerts_generated_total',
    help: 'Total number of alerts generated',
    labelNames: ['type', 'severity'],
    registers: [register]
});

const activeAgents = new promClient.Gauge({
    name: 'siem_active_agents',
    help: 'Number of active SIEM agents',
    registers: [register]
});

const authAttemptsTotal = new promClient.Counter({
    name: 'siem_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['status'],
    registers: [register]
});

// Middleware function
export const metricsMiddleware = (req, res, next) => {
    if (req.path === '/metrics') {
        return next();
    }

    const startTime = Date.now();
    activeConnections.inc();

    const route = getCleanRoute(req);

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode.toString();

        httpRequestsTotal
            .labels(req.method, route, statusCode)
            .inc();

        httpRequestDuration
            .labels(req.method, route, statusCode)
            .observe(duration);

        activeConnections.dec();
    });

    next();
};

// Metrics endpoint
export const metricsEndpoint = async (req, res) => {
    try {
        res.setHeader('Content-Type', promClient.register.contentType);
        const metrics = await promClient.register.metrics();
        res.end(metrics);
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end('Error generating metrics');
    }
};

// Helper function to clean route paths
function getCleanRoute(req) {
    let route = req.path;
    
    // Replace IDs with placeholders
    route = route.replace(/\/\d+/g, '/:id');
    route = route.replace(/\/[a-f0-9-]{36}/g, '/:uuid');
    
    // Group API routes
    if (route.startsWith('/api/')) {
        const parts = route.split('/');
        if (parts.length >= 3) {
            return `/api/${parts[2]}`;
        }
    }
    
    return route;
}

// Exported metrics for use in other files
export const metrics = {
    httpRequestsTotal,
    httpRequestDuration,
    activeConnections,
    databaseQueriesTotal,
    dbQueryDuration,
    dbPoolConnections,
    logsIngestedTotal,
    alertsGeneratedTotal,
    activeAgents,
    authAttemptsTotal,
    
    // Helper functions
    recordDatabaseQuery: (operation, table, duration, status = 'success') => {
        databaseQueriesTotal.labels(operation, table, status).inc();
        dbQueryDuration.labels(operation, table).observe(duration);
    },
    
    recordLogIngestion: (source, severity) => {
        logsIngestedTotal.labels(source, severity).inc();
    },
    
    recordAlert: (type, severity) => {
        alertsGeneratedTotal.labels(type, severity).inc();
    },
    
    recordAuth: (status) => {
        authAttemptsTotal.labels(status).inc();
    },
    
    updateDbPoolStats: (active, idle, waiting) => {
        dbPoolConnections.labels('active').set(active);
        dbPoolConnections.labels('idle').set(idle);
        dbPoolConnections.labels('waiting').set(waiting);
    },
    
    updateActiveAgents: (count) => {
        activeAgents.set(count);
    }
};