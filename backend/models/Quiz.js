const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a quiz title'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    timeLimit: {
        type: Number, // in minutes
        default: 0 // 0 means no limit
    },
    passingScore: {
        type: Number, // percentage
        default: 70
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correctOptionIndex: {
            type: Number,
            required: true
        },
        explanation: {
            type: String, // Optional explanation for the answer
            default: ''
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Multi-tenant: which organization this quiz belongs to (null = legacy)
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
        index: true
    }
});

module.exports = mongoose.model('Quiz', quizSchema);
