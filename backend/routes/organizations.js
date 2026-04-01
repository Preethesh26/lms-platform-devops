// ============================================================
// ORGANIZATION ROUTES (PUBLIC)
// Passphrase check and verification — no auth required
// Mounted at: /api/organizations
// ============================================================

const express = require('express');
const router = express.Router();
const { passphraseCheck, verifyPassphrase } = require('../controllers/organizationController');

// Check if org requires passphrase
router.get('/passphrase-check', passphraseCheck);

// Verify org portal passphrase
router.post('/verify-passphrase', verifyPassphrase);

module.exports = router;
