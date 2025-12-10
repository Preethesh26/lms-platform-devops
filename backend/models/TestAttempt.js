const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Not required - can be null for email-only test takers
    },
    userEmail: {
        type: String,
        lowercase: true
        // Email of the test taker (for non-registered users)
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    maxScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    passed: {
        type: Boolean,
        required: true
    },
    answers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedOptionIndex: {
            type: Number,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    attemptNumber: {
        type: Number,
        default: 1
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    resultEmailSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure one attempt per email per test (for email-based auth)
testAttemptSchema.index({ userEmail: 1, test: 1 }, { unique: true, sparse: true });
// Also ensure one attempt per user per test (for account-based auth)
testAttemptSchema.index({ user: 1, test: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
