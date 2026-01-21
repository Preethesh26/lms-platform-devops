const User = require('../models/User');
const { updateUserInSheet, deleteUserFromSheet } = require('../services/googleSheetsService');

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
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('enrolledCourses')
            .populate('downloadedCertificates');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Aggregate progress for each enrolled course
        const Progress = require('../models/Progress');
        const userData = user.toObject();

        const progressStats = await Promise.all(user.enrolledCourses.map(async (course) => {
            const completedLessons = await Progress.countDocuments({
                user: user._id,
                course: course._id,
                completed: true
            });
            const totalLessons = course.lessons?.length || 0;
            const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return {
                courseId: course._id,
                courseTitle: course.title,
                completedLessons,
                totalLessons,
                percentage,
                isCertificateDownloaded: user.downloadedCertificates.some(cert => cert._id.toString() === course._id.toString())
            };
        }));

        userData.progressStats = progressStats;
        res.status(200).json({ success: true, data: userData });
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

        // Role-based restrictions: Only superadmin can modify an admin
        if (originalUser.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can modify an administrator account.' });
        }

        // Only superadmin can promote someone to admin or superadmin
        if (req.body.role && (req.body.role === 'admin' || req.body.role === 'superadmin') && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can assign admin or superadmin roles.' });
        }

        // If password is being updated, hash it first
        if (req.body.password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        // Check if email already exists for another user
        if (req.body.email && req.body.email !== originalUser.email) {
            const emailExists = await User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.params.id } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email.' });
            }
        }

        // Check if enrollment already exists for another user
        if (req.body.enrollment && req.body.enrollment !== originalUser.enrollment) {
            const enrollmentExists = await User.findOne({ enrollment: req.body.enrollment, _id: { $ne: req.params.id } });
            if (enrollmentExists) {
                return res.status(400).json({ success: false, message: 'Enrollment number already exists.' });
            }
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

        // Sync to Google Sheets (non-blocking)
        updateUserInSheet(user).catch(err => console.error('Sheet Update Background Error:', err));

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
        const userId = req.params.id;
        const userToDelete = await User.findById(userId);

        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Role-based restrictions: Only superadmin can delete an admin
        if (userToDelete.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can delete an administrator account.' });
        }

        // Prevent deleting oneself or another superadmin (optional but safer)
        if (userToDelete.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Super Admin accounts cannot be deleted by regular admins.' });
        }

        await User.findByIdAndDelete(userId);

        // Sync to Google Sheets (non-blocking)
        deleteUserFromSheet(userId).catch(err => console.error('Sheet Delete Background Error:', err));

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

// @desc    Bulk create users from CSV
// @route   POST /api/users/bulk-upload
// @access  Private (Admin)
exports.bulkCreateUsers = async (req, res) => {
    const fs = require('fs');
    const csv = require('csv-parser');

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const users = [];
        const errors = [];
        let lineNumber = 1;

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    lineNumber++;
                    if (!row.name || !row.email) {
                        errors.push({ line: lineNumber, error: 'Missing name or email', data: row });
                        return;
                    }

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(row.email)) {
                        errors.push({ line: lineNumber, error: 'Invalid email', data: row });
                        return;
                    }

                    users.push({
                        name: row.name.trim(),
                        email: row.email.trim().toLowerCase(),
                        enrollment: row.enrollment?.trim() || null,
                        role: row.role?.trim() || 'user',
                        password: row.password?.trim() || Math.random().toString(36).slice(-8)
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        fs.unlinkSync(req.file.path);

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid users', errors });
        }

        // Check duplicates
        const existingEmails = await User.find({ email: { $in: users.map(u => u.email) } }).select('email');
        const existingSet = new Set(existingEmails.map(u => u.email));
        const usersToCreate = users.filter(u => !existingSet.has(u.email));
        const skipped = users.filter(u => existingSet.has(u.email));

        // Auto-generate enrollment numbers
        for (let user of usersToCreate) {
            if (!user.enrollment) {
                const year = new Date().getFullYear();
                const latest = await User.findOne({ enrollment: { $regex: `^ENR-${year}-` } }).sort({ enrollment: -1 });
                let counter = 1;
                if (latest?.enrollment) {
                    const parts = latest.enrollment.split('-');
                    if (parts.length === 3) counter = parseInt(parts[2], 10) + 1;
                }
                user.enrollment = `ENR-${year}-${counter.toString().padStart(5, '0')}`;
            }
        }

        const created = await User.insertMany(usersToCreate, { ordered: false });

        res.status(201).json({
            success: true,
            message: `Created ${created.length} users`,
            created: created.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
                createdUsers: created.map(u => ({ name: u.name, email: u.email, enrollment: u.enrollment })),
                skippedUsers: skipped.map(u => ({ email: u.email, reason: 'Already exists' })),
                errors
            }
        });

    } catch (error) {
        if (req.file && require('fs').existsSync(req.file.path)) {
            require('fs').unlinkSync(req.file.path);
        }
        console.error('Bulk upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

