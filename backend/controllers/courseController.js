const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        // Scope by organizationId if present (org admin/user), otherwise return all (legacy/superadmin)
        const filter = req.organizationId ? { organizationId: req.organizationId } : {};
        const courses = await Course.find(filter);
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // --- Self-Healing Curriculum ---
        // Find all quizzes associated with this course
        const quizzes = await Quiz.find({ course: course._id });
        let updated = false;

        for (const quiz of quizzes) {
            const hasQuiz = course.lessons.some(l =>
                (l.quizId && l.quizId.toString() === quiz._id.toString()) ||
                (l.type === 'quiz' && l.title === quiz.title)
            );

            if (!hasQuiz) {
                course.lessons.push({
                    _id: quiz._id,
                    title: quiz.title,
                    videoUrl: 'QUIZ_PLACEHOLDER',
                    duration: `${quiz.timeLimit > 0 ? quiz.timeLimit + ' min' : 'Untimed'} Quiz`,
                    type: 'quiz',
                    quizId: quiz._id
                });
                updated = true;
            }
        }

        if (updated) {
            await course.save();
            console.log(`[SELF-HEALING] Restored quizzes to curriculum for course: ${course.title}`);
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
    try {
        const filter = req.organizationId
            ? { title: req.body.title, organizationId: req.organizationId }
            : { title: req.body.title };
        const titleExists = await Course.findOne(filter);
        if (titleExists) {
            return res.status(400).json({ success: false, message: 'A course with this title already exists.' });
        }
        // Auto-attach organizationId if present
        const courseData = { ...req.body };
        if (req.organizationId) courseData.organizationId = req.organizationId;
        const course = await Course.create(courseData);
        res.status(201).json({ success: true, data: course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
    try {
        if (req.body.title) {
            const titleExists = await Course.findOne({ title: req.body.title, _id: { $ne: req.params.id } });
            if (titleExists) {
                return res.status(400).json({ success: false, message: 'Another course with this title already exists.' });
            }
        }

        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
