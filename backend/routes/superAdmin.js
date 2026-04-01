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
    getOrgStats
} = require('../controllers/organizationController');
const User = require('../models/User');

// All routes below require Super Admin auth
router.use(protect, requireSuperAdmin);

// Organization management
router.get('/organizations', listOrganizations);
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.get('/organizations/:id/stats', getOrgStats);

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
