const Progress = require('../models/Progress');
const Course = require('../models/Course');

// @desc    Update progress for a specific lesson
// @route   POST /api/progress/update
// @access  Private
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, lessonId, completed, lastPosition, totalDuration } = req.body;

        if (!courseId || !lessonId) {
            return res.status(400).json({ success: false, message: 'Please provide courseId and lessonId' });
        }

        // Upsert progress record
        const progress = await Progress.findOneAndUpdate(
            {
                user: req.user.id,
                course: courseId,
                lessonId: lessonId
            },
            {
                completed,
                lastPosition,
                totalDuration
            },
            { new: true, upsert: true } // Create if not exists
        );

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get progress for all lessons in a course
// @route   GET /api/progress/:courseId
// @access  Private
exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;

        const progress = await Progress.find({
            user: req.user.id,
            course: courseId
        });

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
