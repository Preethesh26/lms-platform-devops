const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    maxScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        default: false
    },
    answers: [{ // Store user's answers for review
        questionIndex: Number,
        selectedOptionIndex: Number,
        isCorrect: Boolean
    }],
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple attempts if desired (optional, currently allowing retakes)
// quizAttemptSchema.index({ user: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
