// ============================================================
// SUPER ADMIN AUTH CONTROLLER — TRIPLE-STEP AUTHENTICATION
//
// Step 1: Verify secret key → returns step1 token
// Step 2: Verify passphrase → returns step2 token
// Step 3: Verify email + password → returns full JWT
//
// Rate limited: 5 failures = 15 min lockout per IP
// ============================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// In-memory rate limit store: { [ip]: { attempts, lockedUntil } }
const rateLimitStore = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Check and update rate limit for an IP
const checkRateLimit = (ip) => {
    const now = Date.now();
    if (!rateLimitStore[ip]) {
        rateLimitStore[ip] = { attempts: 0, lockedUntil: null };
    }
    const record = rateLimitStore[ip];

    // Check if locked
    if (record.lockedUntil && now < record.lockedUntil) {
        const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
        return { locked: true, minutesLeft };
    }

    // Reset if lockout expired
    if (record.lockedUntil && now >= record.lockedUntil) {
        record.attempts = 0;
        record.lockedUntil = null;
    }

    return { locked: false };
};

const recordFailure = (ip) => {
    if (!rateLimitStore[ip]) rateLimitStore[ip] = { attempts: 0, lockedUntil: null };
    rateLimitStore[ip].attempts += 1;
    if (rateLimitStore[ip].attempts >= MAX_ATTEMPTS) {
        rateLimitStore[ip].lockedUntil = Date.now() + LOCKOUT_MS;
    }
};

const clearAttempts = (ip) => {
    if (rateLimitStore[ip]) {
        rateLimitStore[ip].attempts = 0;
        rateLimitStore[ip].lockedUntil = null;
    }
};

// Generate a short-lived step token (5 minutes)
const generateStepToken = (step, extra = {}) => {
    return jwt.sign({ step, ...extra }, process.env.JWT_SECRET, { expiresIn: '5m' });
};

// @desc    Step 1 — Verify secret key
// @route   POST /api/superadmin/auth/step1
// @access  Public
exports.step1 = async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const rateCheck = checkRateLimit(ip);

        if (rateCheck.locked) {
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Try again in ${rateCheck.minutesLeft} minutes.`
            });
        }

        const { secretKey } = req.body;

        if (!secretKey || secretKey !== process.env.SUPER_ADMIN_SECRET_KEY) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid secret key' });
        }

        // Step 1 passed — issue step token
        const stepToken = generateStepToken(1);
        res.status(200).json({ success: true, stepToken });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Step 2 — Verify passphrase
// @route   POST /api/superadmin/auth/step2
// @access  Public (requires valid step1 token)
exports.step2 = async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const rateCheck = checkRateLimit(ip);

        if (rateCheck.locked) {
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Try again in ${rateCheck.minutesLeft} minutes.`
            });
        }

        const { stepToken, passphrase } = req.body;

        // Verify step1 token
        let decoded;
        try {
            decoded = jwt.verify(stepToken, process.env.JWT_SECRET);
        } catch {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid or expired step token' });
        }

        if (decoded.step !== 1) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid step token' });
        }

        // Verify passphrase against bcrypt hash stored in env
        const passphraseHash = process.env.SUPER_ADMIN_PASSPHRASE_HASH;
        if (!passphraseHash) {
            return res.status(500).json({ success: false, message: 'Super admin passphrase not configured' });
        }

        const isValid = await bcrypt.compare(passphrase, passphraseHash);
        if (!isValid) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid passphrase' });
        }

        // Step 2 passed — issue step2 token
        const newStepToken = generateStepToken(2);
        res.status(200).json({ success: true, stepToken: newStepToken });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Step 3 — Verify email + password, issue full JWT
// @route   POST /api/superadmin/auth/step3
// @access  Public (requires valid step2 token)
exports.step3 = async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const rateCheck = checkRateLimit(ip);

        if (rateCheck.locked) {
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Try again in ${rateCheck.minutesLeft} minutes.`
            });
        }

        const { stepToken, email, password } = req.body;

        // Verify step2 token
        let decoded;
        try {
            decoded = jwt.verify(stepToken, process.env.JWT_SECRET);
        } catch {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid or expired step token' });
        }

        if (decoded.step !== 2) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid step token' });
        }

        // Find superadmin user
        const user = await User.findOne({ email: email.toLowerCase(), role: 'superadmin' }).select('+password');
        if (!user) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // All steps passed — check if 2FA is enabled
        clearAttempts(ip);

        if (user.twoFactorEnabled) {
            // Issue a step3 token — frontend must complete 2FA
            const step3Token = generateStepToken(3, { userId: user._id.toString() });
            return res.status(200).json({
                success: true,
                requires2FA: true,
                stepToken: step3Token
            });
        }

        // No 2FA — issue full JWT
        const token = jwt.sign(
            { id: user._id, role: 'superadmin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'superadmin',
                twoFactorEnabled: user.twoFactorEnabled
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Step 4 — Verify 2FA OTP, issue full JWT
// @route   POST /api/superadmin/auth/step4
// @access  Public (requires valid step3 token)
exports.step4 = async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const rateCheck = checkRateLimit(ip);

        if (rateCheck.locked) {
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Try again in ${rateCheck.minutesLeft} minutes.`
            });
        }

        const { stepToken, otp } = req.body;

        // Verify step3 token
        let decoded;
        try {
            decoded = jwt.verify(stepToken, process.env.JWT_SECRET);
        } catch {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid or expired step token' });
        }

        if (decoded.step !== 3 || !decoded.userId) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid step token' });
        }

        const user = await User.findById(decoded.userId).select('+twoFactorSecret');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Verify OTP
        const { authenticator } = require('otplib');
        const isValid = authenticator.check(otp, user.twoFactorSecret);
        if (!isValid) {
            recordFailure(ip);
            return res.status(401).json({ success: false, message: 'Invalid OTP code' });
        }

        // 2FA passed — issue full JWT
        clearAttempts(ip);

        const token = jwt.sign(
            { id: user._id, role: 'superadmin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'superadmin',
                twoFactorEnabled: user.twoFactorEnabled
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
