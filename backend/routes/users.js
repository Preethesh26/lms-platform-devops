const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    enrollCourse,
    bulkCreateUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // All routes require authentication

// Org Super Admin: create an admin user within their org
router.post('/create-admin', authorize('org_superadmin', 'superadmin'), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'name, email and password are required' });
        }

        // Must have org scope
        if (!req.user.organizationId) {
            return res.status(403).json({ success: false, message: 'Organization scope required' });
        }

        const User = require('../models/User');
        const existing = await User.findOne({ email: email.toLowerCase(), organizationId: req.user.organizationId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists in this organization' });
        }

        const admin = await User.create({
            name,
            email,
            password,
            role: 'admin',
            organizationId: req.user.organizationId,
            enrollment: `${req.user.organizationId}-ADM-${Date.now()}`
        });

        res.status(201).json({
            success: true,
            data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.route('/')
    .get(authorize('admin', 'org_superadmin', 'superadmin'), getUsers);

router.post('/bulk-upload', authorize('admin', 'org_superadmin', 'superadmin'), upload.single('file'), bulkCreateUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(authorize('admin', 'org_superadmin', 'superadmin'), deleteUser);

router.post('/:id/enroll', enrollCourse);

module.exports = router;

