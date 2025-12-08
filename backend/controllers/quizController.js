const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Admin)
exports.createQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.create(req.body);

        // If courseId is provided, we might want to automatically add it to the course lessons
        // For now, we'll assume the client handles the course update or we do it here if lesson structure is complex

        res.status(201).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single quiz (for student taking it - NO ANSWERS)
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found'
            });
        }

        // Remove correctOptionIndex from questions for security
        const quizForStudent = quiz.toObject();
        if (req.user.role !== 'admin') {
            quizForStudent.questions = quizForStudent.questions.map(q => {
                const { correctOptionIndex, explanation, ...rest } = q;
                return rest;
            });
        }

        res.status(200).json({
            success: true,
            data: quizForStudent
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single quiz (for admin editing - WITH ANSWERS)
// @route   GET /api/quizzes/:id/edit
// @access  Private (Admin)
exports.getQuizForEdit = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found'
            });
        }

        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found'
            });
        }

        const userAnswers = req.body.answers; // Array of { questionIndex, selectedOptionIndex }
        let score = 0;
        const processedAnswers = [];

        userAnswers.forEach(ans => {
            const question = quiz.questions[ans.questionIndex];
            if (question) {
                const isCorrect = question.correctOptionIndex === ans.selectedOptionIndex;
                if (isCorrect) score++;

                processedAnswers.push({
                    questionIndex: ans.questionIndex,
                    selectedOptionIndex: ans.selectedOptionIndex,
                    isCorrect
                });
            }
        });

        const percentage = (score / quiz.questions.length) * 100;
        const passed = percentage >= quiz.passingScore;

        const attempt = await QuizAttempt.create({
            user: req.user.id,
            quiz: quiz._id,
            score,
            maxScore: quiz.questions.length,
            percentage,
            passed,
            answers: processedAnswers
        });

        res.status(200).json({
            success: true,
            data: {
                score,
                maxScore: quiz.questions.length,
                percentage,
                passed,
                attemptId: attempt._id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get quiz attempts/history
// @route   GET /api/quizzes/:id/attempts
// @access  Private
exports.getQuizAttempts = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({
            user: req.user.id,
            quiz: req.params.id
        }).sort({ completedAt: -1 });

        res.status(200).json({
            success: true,
            data: attempts
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
