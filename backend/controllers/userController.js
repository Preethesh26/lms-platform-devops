const User = require('../models/User');
const { updateUserInSheet, deleteUserFromSheet } = require('../services/googleSheetsService');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        // Scope by organizationId if present
        const filter = req.organizationId ? { organizationId: req.organizationId } : {};
        const users = await User.find(filter).select('-password');
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
        const originalUser = await User.findById(req.params.id);

        if (!originalUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 🔐 Role protection
        if (originalUser.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can modify an administrator account.'
            });
        }

        // 🔐 Only Super Admin can change roles
        if (req.body.role && req.body.role !== originalUser.role) {
            if (req.user.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied: Only Super Admin can change user roles.'
                });
            }
        }

        // 🔐 Org admins cannot assign superadmin role
        if (req.body.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot assign superadmin role'
            });
        }

        // 🔎 Check duplicate email
        if (req.body.email && req.body.email !== originalUser.email) {
            const emailExists = await User.findOne({
                email: req.body.email.toLowerCase(),
                _id: { $ne: req.params.id }
            });

            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }
        }

        // 🔎 Check duplicate enrollment
        if (req.body.enrollment && req.body.enrollment !== originalUser.enrollment) {
            const enrollmentExists = await User.findOne({
                enrollment: req.body.enrollment,
                _id: { $ne: req.params.id }
            });

            if (enrollmentExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Enrollment number already exists.'
                });
            }
        }

        // 🔐 Hash password if updated
        if (req.body.password) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        // ✅ ---- SAFE UPDATE METHOD (IMPORTANT FIX) ----
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Basic fields
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.role !== undefined) user.role = req.body.role;
        if (req.body.enrollment !== undefined) user.enrollment = req.body.enrollment;
        if (req.body.needsPasswordReset !== undefined) user.needsPasswordReset = req.body.needsPasswordReset;

        // 🔥 THIS FIXES YOUR COURSE UPDATE ISSUE
        if (req.body.enrolledCourses !== undefined) {
            user.enrolledCourses = req.body.enrolledCourses;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');

        res.status(200).json({
            success: true,
            data: updatedUser
        });

    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
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
                        // STRICT RBAC: If uploader is not Super Admin, force role to 'user'
                        // This prevents admins from secretly creating other admins via CSV
                        role: req.user.role === 'superadmin' ? (row.role?.trim() || 'user') : 'user',
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

