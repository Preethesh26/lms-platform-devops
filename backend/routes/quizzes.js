const express = require('express');
const {
    createQuiz,
    getAllQuizzes,
    getQuiz,
    getQuizForEdit,
    submitQuiz,
    getQuizAttempts,
    updateQuiz,
    deleteQuiz
} = require('../controllers/quizController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router.post('/', authorize('admin', 'org_superadmin', 'superadmin'), createQuiz);
router.get('/', authorize('admin', 'org_superadmin', 'superadmin'), getAllQuizzes);
router.get('/:id', getQuiz); // Students get sanitized version
router.get('/:id/edit', authorize('admin', 'org_superadmin', 'superadmin'), getQuizForEdit); // Admins get full version
router.post('/:id/submit', submitQuiz);
router.get('/:id/attempts', getQuizAttempts);
router.put('/:id', authorize('admin', 'org_superadmin', 'superadmin'), updateQuiz);
router.delete('/:id', authorize('admin', 'org_superadmin', 'superadmin'), deleteQuiz);

module.exports = router;
