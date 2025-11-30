const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create Mock Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { courseId } = req.body;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if user already enrolled
        const user = await User.findById(req.user.id);
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        // Generate a mock transaction ID
        const transactionId = `mock_txn_${crypto.randomBytes(8).toString('hex')}`;

        // Create pending payment record
        await Payment.create({
            user: req.user.id,
            course: courseId,
            amount: course.price,
            transactionId: transactionId,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            order: {
                id: transactionId,
                amount: course.price * 100,
                currency: 'INR'
            }
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

// @desc    Verify Mock Payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;

        const payment = await Payment.findOne({ transactionId });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        payment.status = 'completed';
        await payment.save();

        // Enroll user in course
        const user = await User.findById(payment.user);
        if (!user.enrolledCourses.includes(payment.course)) {
            user.enrolledCourses.push(payment.course);
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and enrolled successfully'
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};
