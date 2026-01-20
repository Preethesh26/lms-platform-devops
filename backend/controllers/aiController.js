const aiService = require('../services/aiService');
const Course = require('../models/Course');

// @desc    Get AI chat response for a lesson
// @route   POST /api/ai/chat
// @access  Private
exports.getAIChatResponse = async (req, res, next) => {
    try {
        const { courseId, lessonId, question } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const lesson = course.lessons.find(l => l._id.toString() === lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const context = lesson.transcript || lesson.content || "No transcript available for this lesson.";
        const answer = await aiService.getChatResponse(context, question);

        res.status(200).json({
            success: true,
            data: answer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate lesson summary
// @route   POST /api/ai/summarize
// @access  Private
exports.generateLessonSummary = async (req, res, next) => {
    try {
        const { courseId, lessonId } = req.body;

        const course = await Course.findById(courseId);
        const lesson = course?.lessons.find(l => l._id.toString() === lessonId);

        if (!lesson || !lesson.transcript) {
            return res.status(400).json({ success: false, message: 'Lesson transcript required for summary' });
        }

        const summary = await aiService.generateSummary(lesson.transcript);

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate practice quiz
// @route   POST /api/ai/generate-quiz
// @access  Private
exports.generateAIQuiz = async (req, res, next) => {
    try {
        const { topic, struggleAreas } = req.body;

        const quiz = await aiService.generatePracticeQuiz(topic, struggleAreas);

        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error('AI Quiz Generation Controller Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate AI quiz. Please try again later.'
        });
    }
};
