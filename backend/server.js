require('dotenv').config();
console.log("BREVO_API_KEY loaded:", process.env.BREVO_API_KEY ? "Yes" : "No");
console.log("ADMIN_NOTIFICATION_EMAIL loaded:", process.env.ADMIN_NOTIFICATION_EMAIL);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

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
        const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Normalize comparison (remove trailing slash if present)
        const normalize = (url) => url ? url.replace(/\/$/, '') : '';
        const incoming = normalize(origin);
        const allowed = normalize(allowedOrigin);

        // Allow: 
        // 1. Exact match with FRONTEND_URL
        // 2. Localhost (for development)
        // 3. Any Vercel Preview URL (.vercel.app)
        const isAllowed =
            !origin ||
            incoming === allowed ||
            (incoming && incoming.endsWith('.vercel.app'));

        if (isAllowed) {
            // If it's a Vercel preview, echo back the origin so the browser accepts it
            const responseOrigin = (incoming && incoming.endsWith('.vercel.app')) ? origin : allowedOrigin;
            callback(null, responseOrigin);
        } else {
            console.log(`[CORS] Blocked. Origin: ${origin} | Expected: ${allowedOrigin} or *.vercel.app`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

// Serve uploads statically
app.use('/uploads', express.static('uploads'));

// Error handler
app.use(errorHandler);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
