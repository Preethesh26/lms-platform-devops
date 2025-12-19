const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const { sendContactAdminEmail } = require('../services/emailService');

// @desc    Send message to admin
// @route   POST /api/support/contact-admin
// @access  Public
exports.contactAdmin = async (req, res) => {
    try {
        const { name, email, message, subject } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Save ticket to database
        const ticket = await SupportTicket.create({
            name,
            email,
            message,
            subject: subject || 'New Support Inquiry'
        });

        // Find admin user for email notification
        const admin = await User.findOne({ role: 'admin' });

        // Send email to admin (non-blocking notification)
        if (admin) {
            try {
                await sendContactAdminEmail(admin.email, email, name, message);
            } catch (emailError) {
                console.error('Failed to send admin notification email:', emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Your message has been sent to the admin. They will contact you soon.',
            data: ticket
        });
    } catch (error) {
        console.error('Contact admin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all support tickets
// @route   GET /api/support
// @access  Private/Admin
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/support/:id
// @access  Private/Admin
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
