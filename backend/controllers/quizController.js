const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Admin)
// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Admin)
exports.createQuiz = async (req, res) => {
    try {
        const titleExists = await Quiz.findOne({ title: req.body.title, course: req.body.course });
        if (titleExists) {
            return res.status(400).json({ success: false, error: 'A quiz with this title already exists for this course.' });
        }
        const quiz = await Quiz.create(req.body);

        // Automatically add quiz as a lesson to the course
        const course = await Course.findById(req.body.course);
        if (course) {
            course.lessons.push({
                title: quiz.title,
                videoUrl: 'QUIZ_PLACEHOLDER', // Placeholder, not used but schema might require string
                duration: `${quiz.timeLimit > 0 ? quiz.timeLimit + ' min' : 'Untimed'} Quiz`,
                type: 'quiz',
                quizId: quiz._id
            });
            await course.save();
        }

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
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
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

// @desc    Get all quizzes (Admin)
// @route   GET /api/quizzes
// @access  Private (Admin)
exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('course', 'title');

        res.status(200).json({
            success: true,
            data: quizzes
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Admin)
exports.updateQuiz = async (req, res) => {
    try {
        let quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Also update the lesson info in the course if the title changed
        const course = await Course.findById(quiz.course);
        if (course) {
            const lessonIndex = course.lessons.findIndex(l => l.quizId?.toString() === quiz._id.toString());
            if (lessonIndex !== -1) {
                course.lessons[lessonIndex].title = quiz.title;
                course.lessons[lessonIndex].duration = `${quiz.timeLimit > 0 ? quiz.timeLimit + ' min' : 'Untimed'} Quiz`;
                await course.save();
            }
        }

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin)
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        // Remove from course lessons first
        const course = await Course.findById(quiz.course);
        if (course) {
            course.lessons = course.lessons.filter(l => l.quizId?.toString() === quiz._id.toString() ? false : true);
            await course.save();
        }

        await quiz.deleteOne();
        await QuizAttempt.deleteMany({ quiz: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: error.message });
    }
};
