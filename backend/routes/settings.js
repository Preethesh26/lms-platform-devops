const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route to get settings (frontend needs to know whether to show buttons)
// We might want to filter sensitive settings in controller if we add them later
router.get('/', getSettings);

// Admin only route to update
router.put('/', protect, authorize('admin', 'superadmin'), updateSettings);

module.exports = router;
