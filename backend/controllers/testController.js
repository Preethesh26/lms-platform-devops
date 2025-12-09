const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const { sendTestInvitationEmail } = require('../services/emailService');

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private (Admin)
exports.createTest = async (req, res) => {
    try {
        const test = await Test.create({
            ...req.body,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all tests (admin)
// @route   GET /api/tests
// @access  Private (Admin)
exports.getAllTests = async (req, res) => {
    try {
        const tests = await Test.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // Add completion stats for each test
        const testsWithStats = await Promise.all(tests.map(async (test) => {
            const totalInvited = test.invitedUsers.length;
            const completedCount = await TestAttempt.countDocuments({ test: test._id });

            return {
                ...test.toObject(),
                stats: {
                    totalInvited,
                    completed: completedCount,
                    pending: totalInvited - completedCount
                }
            };
        }));

        res.status(200).json({
            success: true,
            count: tests.length,
            data: testsWithStats
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private (Admin)
exports.getTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (Admin)
exports.updateTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private (Admin)
exports.deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        // Delete all attempts for this test
        await TestAttempt.deleteMany({ test: req.params.id });

        await test.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Publish/Unpublish test
// @route   PUT /api/tests/:id/publish
// @access  Private (Admin)
exports.togglePublish = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        test.isPublished = !test.isPublished;
        await test.save();

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get test by slug (for users)
// @route   GET /api/tests/access/:slug
// @access  Private
exports.getTestBySlug = async (req, res) => {
    try {
        const test = await Test.findOne({ accessSlug: req.params.slug });

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        if (!test.isPublished) {
            return res.status(403).json({
                success: false,
                error: 'Test is not published'
            });
        }

        // Check if user is invited
        const isInvited = test.invitedUsers.some(
            invited => invited.email === req.user.email
        );

        if (!isInvited) {
            return res.status(403).json({
                success: false,
                error: 'You are not invited to this test'
            });
        }

        // Check if user already attempted
        const existingAttempt = await TestAttempt.findOne({
            user: req.user.id,
            test: test._id
        });

        if (existingAttempt) {
            return res.status(200).json({
                success: true,
                alreadyAttempted: true,
                attempt: existingAttempt
            });
        }

        // Check deadline
        if (test.hasDeadline && test.deadline && new Date() > test.deadline) {
            return res.status(403).json({
                success: false,
                error: 'Test deadline has passed'
            });
        }

        // Return test without correct answers
        const testForUser = test.toObject();
        testForUser.questions = testForUser.questions.map(q => {
            const { correctOptionIndex, explanation, ...rest } = q;
            return rest;
        });

        res.status(200).json({
            success: true,
            alreadyAttempted: false,
            data: testForUser
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Submit test attempt
// @route   POST /api/tests/:id/submit
// @access  Private
exports.submitTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        // Check if user already attempted
        const existingAttempt = await TestAttempt.findOne({
            user: req.user.id,
            test: test._id
        });

        if (existingAttempt) {
            return res.status(400).json({
                success: false,
                error: 'You have already attempted this test'
            });
        }

        const userAnswers = req.body.answers; // Array of { questionIndex, selectedOptionIndex }
        let score = 0;
        const processedAnswers = [];

        userAnswers.forEach(ans => {
            const question = test.questions[ans.questionIndex];
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

        const percentage = (score / test.questions.length) * 100;
        const passed = percentage >= test.passingScore;

        const attempt = await TestAttempt.create({
            user: req.user.id,
            test: test._id,
            score,
            maxScore: test.questions.length,
            percentage,
            passed,
            answers: processedAnswers
        });

        res.status(200).json({
            success: true,
            data: {
                score,
                maxScore: test.questions.length,
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

// @desc    Get test results (for user)
// @route   GET /api/tests/:id/result
// @access  Private
exports.getTestResult = async (req, res) => {
    try {
        const attempt = await TestAttempt.findOne({
            user: req.user.id,
            test: req.params.id
        }).populate('test', 'title passingScore');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: 'No attempt found'
            });
        }

        res.status(200).json({
            success: true,
            data: attempt
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get test completion stats (admin)
// @route   GET /api/tests/:id/stats
// @access  Private (Admin)
exports.getTestStats = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        const attempts = await TestAttempt.find({ test: req.params.id })
            .populate('user', 'name email enrollment');

        const totalInvited = test.invitedUsers.length;
        const completed = attempts.length;
        const passed = attempts.filter(a => a.passed).length;
        const failed = attempts.filter(a => !a.passed).length;

        res.status(200).json({
            success: true,
            data: {
                totalInvited,
                completed,
                pending: totalInvited - completed,
                passed,
                failed,
                attempts
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

// @desc    Send invitation emails
// @route   POST /api/tests/:id/send-invitations
// @access  Private (Admin)
exports.sendInvitations = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found'
            });
        }

        if (!test.isPublished) {
            return res.status(400).json({
                success: false,
                error: 'Test must be published before sending invitations'
            });
        }

        // Get users who haven't received emails yet
        const usersToEmail = test.invitedUsers.filter(u => !u.emailSent);

        if (usersToEmail.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'All invited users have already received emails'
            });
        }

        const testLink = `${process.env.FRONTEND_URL}/test/${test.accessSlug}`;
        const emailsSent = [];
        const emailsFailed = [];

        // Send emails
        for (const invitedUser of usersToEmail) {
            try {
                const testData = {
                    title: test.title,
                    description: test.description,
                    questionCount: test.questions.length,
                    timeLimit: test.timeLimit,
                    passingScore: test.passingScore,
                    deadline: test.hasDeadline ? test.deadline : null,
                    link: testLink
                };

                const result = await sendTestInvitationEmail(invitedUser.email, testData);

                if (result.success) {
                    emailsSent.push(invitedUser.email);

                    // Mark as sent
                    const userIndex = test.invitedUsers.findIndex(u => u.email === invitedUser.email);
                    if (userIndex !== -1) {
                        test.invitedUsers[userIndex].emailSent = true;
                    }
                } else {
                    emailsFailed.push(invitedUser.email);
                }
            } catch (error) {
                console.error(`Failed to send email to ${invitedUser.email}:`, error);
                emailsFailed.push(invitedUser.email);
            }
        }

        // Save updated test
        await test.save();

        res.status(200).json({
            success: true,
            data: {
                sent: emailsSent.length,
                failed: emailsFailed.length,
                emailsSent,
                emailsFailed
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
