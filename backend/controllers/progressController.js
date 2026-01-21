const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const { calculateLevel } = require('../utils/gamificationUtils');


// @desc    Update progress for a specific lesson
// @route   POST /api/progress/update
// @access  Private
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, lessonId, completed, lastPosition, totalDuration } = req.body;

        if (!courseId || !lessonId) {
            return res.status(400).json({ success: false, message: 'Please provide courseId and lessonId' });
        }

        // Check if this is the first time completing this lesson to award XP
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const lesson = course.lessons.find(l => l._id.toString() === lessonId);
        if (lesson && lesson.type === 'quiz' && completed) {
            return res.status(403).json({
                success: false,
                message: 'Quiz lessons can only be completed by passing the quiz.'
            });
        }

        const existingProgress = await Progress.findOne({
            user: req.user.id,
            course: courseId,
            lessonId: lessonId
        });

        const newlyCompleted = completed && (!existingProgress || !existingProgress.completed);

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

        // Award XP if newly completed
        let xpEarned = 0;
        let updatedUser = null;

        if (newlyCompleted) {
            const user = await User.findById(req.user.id);
            if (user) {
                user.xp += 50; // 50 XP per lesson
                user.level = calculateLevel(user.xp);
                await user.save();
                xpEarned = 50;
                updatedUser = {
                    xp: user.xp,
                    level: user.level,
                    streak: user.streak
                };
            }
        }

        res.status(200).json({
            success: true,
            data: progress,
            xpEarned,
            user: updatedUser
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
// @desc    Get progress for all courses a user is enrolled in
// @route   GET /api/progress/all
// @access  Private
exports.getAllUserProgress = async (req, res) => {
    try {
        const progress = await Progress.find({
            user: req.user.id
        });

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error fetching all progress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// @desc    Admin: Update/Reset progress for all lessons in a course for a specific user
// @route   POST /api/progress/admin/update-course
// @access  Private/Admin
exports.adminUpdateCourseProgress = async (req, res) => {
    try {
        const { userId, courseId, action } = req.body; // action: 'complete' | 'reset'

        if (!userId || !courseId || !action) {
            return res.status(400).json({ success: false, message: 'Please provide userId, courseId, and action' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (action === 'reset') {
            await Progress.deleteMany({ user: userId, course: courseId });
            return res.status(200).json({ success: true, message: 'Course progress reset successfully' });
        }

        if (action === 'complete') {
            const lessons = course.lessons || [];

            // Mark all video lessons as completed. 
            // Note: Quizzes are usually separate, but for 'admin override complete', we mark everything as done.
            for (const lesson of lessons) {
                await Progress.findOneAndUpdate(
                    {
                        user: userId,
                        course: courseId,
                        lessonId: lesson._id
                    },
                    {
                        completed: true,
                        lastPosition: 0,
                        totalDuration: 0
                    },
                    { new: true, upsert: true }
                );
            }

            return res.status(200).json({ success: true, message: 'Course marked as completed successfully' });
        }

        res.status(400).json({ success: false, message: 'Invalid action' });

    } catch (error) {
        console.error('Error in adminUpdateCourseProgress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
