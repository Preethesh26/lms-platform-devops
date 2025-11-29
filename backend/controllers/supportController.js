const User = require('../models/User');
const { sendContactAdminEmail } = require('../services/emailService');

// @desc    Send message to admin
// @route   POST /api/support/contact-admin
// @access  Public
exports.contactAdmin = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            return res.status(500).json({
                success: false,
                message: 'Admin contact not configured. Please try again later.'
            });
        }

        // Send email to admin
        const emailResult = await sendContactAdminEmail(admin.email, email, name, message);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Error sending message. Please try again later.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Your message has been sent to the admin. They will contact you soon.'
        });
    } catch (error) {
        console.error('Contact admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
