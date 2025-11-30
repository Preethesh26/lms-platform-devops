const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a course title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a course description']
    },
    thumbnail: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    videoUrl: {
        type: String,
        required: false
    },
    lessons: [lessonSchema],
    color: {
        type: String,
        default: 'bg-blue-500/10 text-blue-500'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Course', courseSchema);
