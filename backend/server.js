require('dotenv').config();
console.log("BREVO_API_KEY loaded:", process.env.BREVO_API_KEY ? "Yes" : "No");
console.log("ADMIN_NOTIFICATION_EMAIL loaded:", process.env.ADMIN_NOTIFICATION_EMAIL);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

// Route imports
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');
const supportRoutes = require('./routes/support');
const paymentRoutes = require('./routes/payment');
const analyticsRoutes = require('./routes/analytics');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quizzes');
const testRoutes = require('./routes/tests');
const certificateRoutes = require('./routes/certificate');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const normalize = (url) => (url ? url.replace(/\/$/, '') : '');
        const incoming = normalize(origin);

        // Comma-separated list, e.g. "https://app.vercel.app,https://staging.vercel.app"
        const allowedList = (process.env.FRONTEND_URL || 'http://localhost:5173')
            .split(',')
            .map((s) => normalize(s.trim()))
            .filter(Boolean);

        const isLocalhostOrigin = (url) => {
            if (!url) return false;
            try {
                const u = new URL(url);
                return (
                    u.protocol === 'http:' &&
                    (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
                );
            } catch {
                return false;
            }
        };

        // Allow:
        // 1. Non-browser / same-origin (no Origin header)
        // 2. Exact match to any entry in FRONTEND_URL
        // 3. Any http://localhost or http://127.0.0.1 port (Vite may use 5174+ if 5173 is taken)
        // 4. Any Vercel preview / production host (*.vercel.app)
        const isAllowed =
            !origin ||
            allowedList.includes(incoming) ||
            isLocalhostOrigin(incoming) ||
            (incoming && incoming.endsWith('.vercel.app'));

        if (isAllowed) {
            // Reflect the request Origin when present so credentialed requests work on that host:port
            if (!origin) {
                callback(null, true);
            } else {
                callback(null, origin);
            }
        } else {
            console.log(
                `[CORS] Blocked. Origin: ${origin} | Allowed: ${allowedList.join(', ')} or localhost or *.vercel.app`
            );
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));

// Multi-tenant routes
app.use('/api/superadmin/auth', require('./routes/superAdminAuth'));
app.use('/api/superadmin', require('./routes/superAdmin'));
app.use('/api/organizations', require('./routes/organizations'));

// Org scope middleware — applied to all routes that need tenant isolation
// Controllers use req.organizationId (set by requireOrgScope) to filter queries
const requireOrgScope = require('./middleware/requireOrgScope');

// Serve uploads statically
app.use('/uploads', express.static('uploads'));

// Error handler
app.use(errorHandler);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Prometheus metrics
app.get('/metrics', metricsHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
