const express = require('express');
const {
    createTest,
    getAllTests,
    getTest,
    updateTest,
    deleteTest,
    togglePublish,
    getTestBySlug,
    submitTest,
    getTestResult,
    getTestStats,
    getTestAttempts,
    sendInvitations,
    authenticateForTest
} = require('../controllers/testController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.post('/:slug/authenticate', authenticateForTest);

// Public route (no authentication required to view test info)
router.get('/access/:slug', getTestBySlug);

// Protected routes (require authentication)
router.use(protect);

// Admin routes
router.route('/')
    .get(authorize('admin', 'superadmin'), getAllTests)
    .post(authorize('admin', 'superadmin'), createTest);

router.route('/:id')
    .get(authorize('admin', 'superadmin'), getTest)
    .put(authorize('admin', 'superadmin'), updateTest)
    .delete(authorize('admin', 'superadmin'), deleteTest);

router.put('/:id/publish', authorize('admin', 'superadmin'), togglePublish);
router.get('/:id/stats', authorize('admin', 'superadmin'), getTestStats);
router.get('/:id/attempts', authorize('admin', 'superadmin'), getTestAttempts); // Added route
router.post('/:id/send-invitations', authorize('admin', 'superadmin'), sendInvitations);

// User routes
// Use protectOrTestToken so both logged-in users and guest test takers can submit
const { protectOrTestToken } = require('../middleware/auth');
router.post('/:id/submit', protectOrTestToken, submitTest);
router.get('/:id/result', protectOrTestToken, getTestResult);

module.exports = router;
