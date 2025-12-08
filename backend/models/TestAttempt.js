const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Ensure one attempt per user per test
testAttemptSchema.index({ user: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
