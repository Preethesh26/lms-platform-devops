const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const { sendTestInvitationEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate random 8-character password (letters + numbers)
const generateTestPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

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

// @desc    Get test by slug (public access info)
// @route   GET /api/tests/access/:slug
// @access  Public
exports.getTestBySlug = async (req, res) => {
    try {
        const test = await Test.findOne({ accessSlug: req.params.slug })
            .select('title description timeLimit passingScore hasDeadline deadline requiresAccountLogin accessSlug isPublished');

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
        let userQuery = {};

        if (req.user) {
            userQuery = { user: req.user.id, test: test._id };
        } else if (req.testToken) {
            // Verify the token belongs to this test
            if (req.testToken.testId !== req.params.id) {
                return res.status(403).json({ success: false, error: 'Token valid for different test' });
            }
            userQuery = { userEmail: req.testToken.email, test: test._id };
        } else {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const existingAttempt = await TestAttempt.findOne(userQuery);

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

        const attemptData = {
            test: test._id,
            score,
            maxScore: test.questions.length,
            percentage,
            passed,
            answers: processedAnswers
        };

        if (req.user) {
            attemptData.user = req.user.id;
            attemptData.userEmail = req.user.email;
        } else if (req.testToken) {
            attemptData.userEmail = req.testToken.email;
        }

        const attempt = await TestAttempt.create(attemptData);

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
        let query = { test: req.params.id };

        if (req.user) {
            query.user = req.user.id;
        } else if (req.testToken) {
            query.userEmail = req.testToken.email;
        } else {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const attempt = await TestAttempt.findOne(query).populate('test', 'title passingScore');

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

// @desc    Get all attempts for a specific test
// @route   GET /api/tests/:id/attempts
// @access  Private (Admin)
exports.getTestAttempts = async (req, res) => {
    try {
        const attempts = await TestAttempt.find({ test: req.params.id })
            .populate('user', 'name email enrollment')
            .sort('-score');

        res.status(200).json({
            success: true,
            count: attempts.length,
            data: attempts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
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
                // Generate password if test doesn't require account login
                let plainPassword = null;
                if (!test.requiresAccountLogin) {
                    // Check if user already has a password
                    if (!invitedUser.accessPassword) {
                        plainPassword = generateTestPassword();
                        const hashedPassword = await bcrypt.hash(plainPassword, 10);

                        // Update user's password in the test
                        const userIndex = test.invitedUsers.findIndex(u => u.email === invitedUser.email);
                        if (userIndex !== -1) {
                            test.invitedUsers[userIndex].accessPassword = hashedPassword;
                        }
                    }
                }

                const testData = {
                    title: test.title,
                    description: test.description,
                    questionCount: test.questions.length,
                    timeLimit: test.timeLimit,
                    passingScore: test.passingScore,
                    deadline: test.hasDeadline ? test.deadline : null,
                    link: testLink,
                    requiresAccountLogin: test.requiresAccountLogin,
                    password: plainPassword,  // Include generated password
                    email: invitedUser.email
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

// @desc    Authenticate for test access (email + password)
// @route   POST /api/tests/:slug/authenticate
// @access  Public
exports.authenticateForTest = async (req, res) => {
    try {
        const { email, password } = req.body;
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

        // Find invited user
        const invitedUser = test.invitedUsers.find(u => u.email === email.toLowerCase());

        if (!invitedUser) {
            return res.status(403).json({
                success: false,
                error: 'You are not invited to this test'
            });
        }

        // Check if test requires account login
        if (test.requiresAccountLogin) {
            return res.status(400).json({
                success: false,
                error: 'This test requires LMS account login',
                requiresAccountLogin: true
            });
        }

        // Verify password
        if (!invitedUser.accessPassword) {
            return res.status(400).json({
                success: false,
                error: 'Access password not set. Please contact administrator.'
            });
        }

        const isMatch = await bcrypt.compare(password, invitedUser.accessPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }

        // Check if already attempted
        const existingAttempt = await TestAttempt.findOne({
            test: test._id,
            'userEmail': email.toLowerCase()
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

        // Generate test-specific token
        const token = jwt.sign(
            {
                email: email.toLowerCase(),
                testId: test._id,
                slug: test.accessSlug
            },
            process.env.JWT_SECRET,
            { expiresIn: `${test.timeLimit > 0 ? test.timeLimit + 60 : 180}m` }
        );

        // Return test without correct answers
        const testForUser = test.toObject();
        testForUser.questions = testForUser.questions.map(q => {
            const { correctOptionIndex, explanation, ...rest } = q;
            return rest;
        });

        res.status(200).json({
            success: true,
            token,
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
