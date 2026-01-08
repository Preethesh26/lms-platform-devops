const express = require('express');
const { register, login, getMe, setup2FA, enable2FA, verify2FA, disable2FA, impersonate, masterUnlock } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// 2FA Routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/impersonate', protect, authorize('admin', 'superadmin'), impersonate);
router.post('/master-unlock', masterUnlock);

module.exports = router;
