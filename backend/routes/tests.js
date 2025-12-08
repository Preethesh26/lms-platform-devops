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
    getTestStats
} = require('../controllers/testController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route (requires authentication but not admin)
router.get('/access/:slug', protect, getTestBySlug);

// Protected routes (require authentication)
router.use(protect);

// Admin routes
router.route('/')
    .get(authorize('admin'), getAllTests)
    .post(authorize('admin'), createTest);

router.route('/:id')
    .get(authorize('admin'), getTest)
    .put(authorize('admin'), updateTest)
    .delete(authorize('admin'), deleteTest);

router.put('/:id/publish', authorize('admin'), togglePublish);
router.get('/:id/stats', authorize('admin'), getTestStats);

// User routes
router.post('/:id/submit', submitTest);
router.get('/:id/result', getTestResult);

module.exports = router;
