const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
    lessonId: {
        type: String, // Since lessons are subdocuments or just objects in array, we track by ID string
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    lastPosition: {
        type: Number, // Time in seconds
        default: 0
    },
    totalDuration: {
        type: Number, // Total duration of video in seconds
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure one progress record per user per lesson
progressSchema.index({ user: 1, course: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
