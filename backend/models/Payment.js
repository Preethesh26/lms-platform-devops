const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    billingCycle: {
        type: String,
        enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
        default: 'one_time'
    },
    planType: {
        type: String,
        enum: ['one_time', 'subscription'],
        default: 'one_time'
    },
    coupon: {
        code: {
            type: String,
            trim: true,
            uppercase: true
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed']
        },
        value: {
            type: Number,
            min: 0
        }
    },
    isSubscriptionActive: {
        type: Boolean,
        default: false
    },
    subscriptionRenewalDate: {
        type: Date
    },
    transactionId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
