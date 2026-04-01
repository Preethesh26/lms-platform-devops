// ============================================================
// SUPER ADMIN AUTH ROUTES
// Triple-step authentication for the Super Admin
// Mounted at: /api/superadmin/auth
// ============================================================

const express = require('express');
const router = express.Router();
const { step1, step2, step3 } = require('../controllers/superAdminAuthController');

// Step 1: Verify secret key
router.post('/step1', step1);

// Step 2: Verify passphrase (requires step1 token)
router.post('/step2', step2);

// Step 3: Verify email + password (requires step2 token), issues full JWT
router.post('/step3', step3);

module.exports = router;
