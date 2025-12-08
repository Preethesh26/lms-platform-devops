const express = require('express');
const {
    createQuiz,
    getAllQuizzes,
    getQuiz,
    getQuizForEdit,
    submitQuiz,
    getQuizAttempts
} = require('../controllers/quizController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are protected

router.post('/', authorize('admin'), createQuiz);
router.get('/', authorize('admin'), getAllQuizzes);
router.get('/:id', getQuiz); // Students get sanitized version
router.get('/:id/edit', authorize('admin'), getQuizForEdit); // Admins get full version
router.post('/:id/submit', submitQuiz);
router.get('/:id/attempts', getQuizAttempts);

module.exports = router;
