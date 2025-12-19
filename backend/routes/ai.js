const express = require('express');
const router = express.Router();
const {
    getAIChatResponse,
    generateLessonSummary,
    generateAIQuiz
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes are protected
router.use(protect);

router.post('/chat', getAIChatResponse);
router.post('/summarize', generateLessonSummary);
router.post('/generate-quiz', generateAIQuiz);

module.exports = router;
