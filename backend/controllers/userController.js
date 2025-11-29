const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('enrolledCourses');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        // Get the original user data before update
        const originalUser = await User.findById(req.params.id);
        if (!originalUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Send email notification about profile update (non-blocking)
        try {
            const { sendProfileUpdateEmail } = require('../services/emailService');

            // Determine what changed
            const changes = {};
            if (req.body.name && req.body.name !== originalUser.name) changes.name = true;
            if (req.body.email && req.body.email !== originalUser.email) changes.email = req.body.email;
            if (req.body.role && req.body.role !== originalUser.role) changes.role = req.body.role;
            if (req.body.password) changes.password = true;
            if (req.body.enrollment && req.body.enrollment !== originalUser.enrollment) changes.enrollment = req.body.enrollment;

            // Only send email if there are actual changes
            if (Object.keys(changes).length > 0) {
                // Use the new email if it was changed, otherwise use the original
                const emailTo = changes.email || originalUser.email;
                await sendProfileUpdateEmail(emailTo, user.name, changes);
                console.log(`Profile update email sent to ${emailTo}`);
            }
        } catch (emailError) {
            console.error('Failed to send profile update email:', emailError);
            // Don't fail the update if email fails
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Enroll user in course
// @route   POST /api/users/:id/enroll
// @access  Private
exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        user.enrolledCourses.push(courseId);
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
