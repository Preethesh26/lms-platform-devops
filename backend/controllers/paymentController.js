const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
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

        const options = {
            amount: course.price * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Create pending payment record
        await Payment.create({
            user: req.user.id,
            course: courseId,
            amount: course.price,
            razorpayOrderId: order.id,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

// @desc    Verify Payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update payment status
            const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

            if (!payment) {
                return res.status(404).json({ success: false, message: 'Payment record not found' });
            }

            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
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
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};
