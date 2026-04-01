// ============================================================
// SUPER ADMIN ROUTES
// All routes require Super Admin JWT
// Mounted at: /api/superadmin
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');
const {
    createOrganization,
    listOrganizations,
    updateOrganization,
    deleteOrganization,
    getOrgStats,
    getOrgUsers,
    createOrgUser,
    updateOrgUser,
    deleteOrgUser,
    getOrgCourses
} = require('../controllers/organizationController');
const User = require('../models/User');

// All routes below require Super Admin auth
router.use(protect, requireSuperAdmin);

// Organization management
router.get('/organizations', listOrganizations);
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);
router.get('/organizations/:id/stats', getOrgStats);
router.get('/organizations/:id/users', getOrgUsers);
router.post('/organizations/:id/users', createOrgUser);
router.put('/organizations/:id/users/:userId', updateOrgUser);
router.delete('/organizations/:id/users/:userId', deleteOrgUser);
router.get('/organizations/:id/courses', getOrgCourses);

// Cross-org user listing (filterable by orgId query param)
router.get('/users', async (req, res) => {
    try {
        const filter = {};
        if (req.query.orgId) filter.organizationId = req.query.orgId;
        const users = await User.find(filter).select('-password -twoFactorSecret');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
