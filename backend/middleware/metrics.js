// ============================================================
// PROMETHEUS METRICS MIDDLEWARE
// Tracks HTTP requests so Grafana can display them
// Exposes metrics at GET /metrics
// ============================================================

const client = require('prom-client');

// Create a metrics registry (container for all metrics)
const register = new client.Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register });

// ── Custom metric 1: Count every HTTP request ─────────────
// Labels: method (GET/POST), route (/api/users), status (200/404)
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests received',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

// ── Custom metric 2: How long each request takes ──────────
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'How long HTTP requests take in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
});

// ── Custom metric 3: How many connections are open right now
const activeConnections = new client.Gauge({
    name: 'active_connections',
    help: 'Number of currently active connections',
    registers: [register],
});

// ── Middleware: runs on every request ─────────────────────
const metricsMiddleware = (req, res, next) => {
    const endTimer = httpRequestDuration.startTimer();
    activeConnections.inc();  // connection opened

    // When the response finishes, record the metrics
    res.on('finish', () => {
        const route = req.route ? req.baseUrl + req.route.path : req.path;
        const labels = {
            method: req.method,
            route,
            status: res.statusCode,
        };
        httpRequestsTotal.inc(labels);
        endTimer(labels);
        activeConnections.dec();  // connection closed
    });

    next();
};

// ── Route handler: serves metrics to Prometheus ───────────
const metricsHandler = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports = { metricsMiddleware, metricsHandler };
