const express = require('express');
const { getDashboardStats, getGrowthData } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All analytics routes are protected and admin-only
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/stats', getDashboardStats);
router.get('/growth', getGrowthData);

module.exports = router;
