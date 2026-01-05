const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authenticator = require('otplib').authenticator;
const qrcode = require('qrcode');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};


const { sendWelcomeEmail, sendAdminNewUserNotification } = require('../services/emailService');
const { appendUserToSheet } = require('../services/googleSheetsService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        let { name, email, password, enrollment, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Auto-generate enrollment number if not provided (for self-registration)
        if (!enrollment) {
            const year = new Date().getFullYear();
            // Find the latest user with an enrollment number for this year
            const latestUser = await User.findOne({
                enrollment: { $regex: `^ENR-${year}-` }
            }).sort({ enrollment: -1 });

            let counter = 1;
            if (latestUser && latestUser.enrollment) {
                const parts = latestUser.enrollment.split('-');
                if (parts.length === 3) {
                    counter = parseInt(parts[2], 10) + 1;
                }
            }

            const counterStr = counter.toString().padStart(5, '0');
            enrollment = `ENR-${year}-${counterStr}`;
        }

        // Force role to 'user' if not explicitly set (for public registrations)
        if (!role) {
            role = 'user';
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            enrollment,
            role
        });

        // Send welcome email to user (non-blocking)
        try {
            await sendWelcomeEmail(email, name, password, enrollment, role);
            console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Send notification to admin (non-blocking)
        try {
            // Fallback to hardcoded email if env var is missing or undefined
            const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'academypro.desk@gmail.com';

            console.log(`DEBUG: Using admin email: ${adminEmail}`);
            console.log(`DEBUG: Env var value was: ${process.env.ADMIN_NOTIFICATION_EMAIL}`);

            const emailResult = await sendAdminNewUserNotification(adminEmail, name, email, enrollment);
            console.log('Admin notification result:', JSON.stringify(emailResult));
            console.log(`Admin notification sent to ${adminEmail}`);
        } catch (emailError) {
            console.error('Failed to send admin notification:', emailError);
        }

        // Sync to Google Sheets (non-blocking)
        appendUserToSheet(user).catch(err => console.error('Sheet Sync Background Error:', err));

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                enrollment: user.enrollment
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            console.log('Login failed: Missing email or password');
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log(`Login failed: User not found for email ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.role === 'admin' && user.email !== 'demo-admin@academypro.com' && user.twoFactorEnabled) {
            return res.status(200).json({
                success: true,
                requires2FA: true,
                tempToken: generateToken(user._id) // Short-lived token for 2FA verification step
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                enrollment: user.enrollment,
                enrolledCourses: user.enrolledCourses,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Setup 2FA (Generate secret and QR)
// @route   POST /api/auth/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const secret = authenticator.generateSecret();

        user.twoFactorSecret = secret;
        await user.save();

        const otpauth = authenticator.keyuri(user.email, 'AcademyPro LMS', secret);
        const imageUrl = await qrcode.toDataURL(otpauth);

        res.status(200).json({
            success: true,
            secret,
            qrCode: imageUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify 2FA and Enable
// @route   POST /api/auth/2fa/enable
// @access  Private
exports.enable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id).select('+twoFactorSecret');

        if (!authenticator.check(token, user.twoFactorSecret)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.status(200).json({ success: true, message: '2FA Enabled Successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify 2FA during Login
// @route   POST /api/auth/2fa/verify
// @access  Public (with temp token)
exports.verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        // User is attached via middleware using tempToken
        const user = await User.findById(req.user.id).select('+twoFactorSecret');

        if (!authenticator.check(token, user.twoFactorSecret)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const access_token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token: access_token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                enrollment: user.enrollment,
                enrolledCourses: user.enrolledCourses,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
