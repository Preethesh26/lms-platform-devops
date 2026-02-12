const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');

const getBillingCycleDays = (billingCycle) => {
    const cycleDays = {
        monthly: 30,
        quarterly: 90,
        yearly: 365
    };

    return cycleDays[billingCycle] || 0;
};

const calculateCouponDiscount = (amount, coupon) => {
    if (!coupon || !coupon.code) {
        return { discountAmount: 0, normalizedCoupon: null };
    }

    const normalizedCode = String(coupon.code).trim().toUpperCase();
    const supportedCoupons = {
        SAVE10: { type: 'percentage', value: 10 },
        SAVE25: { type: 'percentage', value: 25 },
        FLAT500: { type: 'fixed', value: 500 }
    };

    const selectedCoupon = supportedCoupons[normalizedCode];
    if (!selectedCoupon) {
        throw new Error('Invalid coupon code');
    }

    let discountAmount = selectedCoupon.type === 'percentage'
        ? (amount * selectedCoupon.value) / 100
        : selectedCoupon.value;

    discountAmount = Math.min(Math.round(discountAmount), amount);

    return {
        discountAmount,
        normalizedCoupon: {
            code: normalizedCode,
            type: selectedCoupon.type,
            value: selectedCoupon.value
        }
    };
};

// @desc    Create Mock Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { courseId, couponCode, planType = 'one_time', billingCycle = 'one_time' } = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if user already enrolled
        const user = await User.findById(req.user.id);
        // Ensure we are comparing strings
        const isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId.toString());

        if (isEnrolled) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        const normalizedPlanType = planType === 'subscription' ? 'subscription' : 'one_time';
        const normalizedBillingCycle = normalizedPlanType === 'subscription'
            ? ['monthly', 'quarterly', 'yearly'].includes(billingCycle) ? billingCycle : 'monthly'
            : 'one_time';

        const { discountAmount, normalizedCoupon } = calculateCouponDiscount(course.price, { code: couponCode });
        const finalAmount = Math.max(0, course.price - discountAmount);

        // Generate a mock transaction ID
        const transactionId = `mock_txn_${crypto.randomBytes(8).toString('hex')}`;

        // Create pending payment record
        await Payment.create({
            user: req.user.id,
            course: courseId,
            amount: course.price,
            discountAmount,
            finalAmount,
            transactionId: transactionId,
            planType: normalizedPlanType,
            billingCycle: normalizedBillingCycle,
            coupon: normalizedCoupon || undefined,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            order: {
                id: transactionId,
                amount: finalAmount * 100,
                currency: 'INR'
            },
            pricing: {
                baseAmount: course.price,
                discountAmount,
                finalAmount,
                coupon: normalizedCoupon,
                planType: normalizedPlanType,
                billingCycle: normalizedBillingCycle
            }
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        const statusCode = error.message === 'Invalid coupon code' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: 'Payment initiation failed', error: error.message });
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

        if (payment.planType === 'subscription') {
            payment.isSubscriptionActive = true;
            const renewalDays = getBillingCycleDays(payment.billingCycle);
            if (renewalDays > 0) {
                const renewalDate = new Date();
                renewalDate.setDate(renewalDate.getDate() + renewalDays);
                payment.subscriptionRenewalDate = renewalDate;
            }
        }

        await payment.save();

        // Enroll user in course
        const user = await User.findById(payment.user);
        if (!user.enrolledCourses.includes(payment.course)) {
            user.enrolledCourses.push(payment.course);
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and enrolled successfully',
            data: {
                status: payment.status,
                planType: payment.planType,
                billingCycle: payment.billingCycle,
                finalAmount: payment.finalAmount,
                discountAmount: payment.discountAmount,
                isSubscriptionActive: payment.isSubscriptionActive,
                subscriptionRenewalDate: payment.subscriptionRenewalDate
            }
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};
