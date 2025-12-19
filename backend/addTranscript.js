const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course');

const addTranscript = async (courseId, lessonId, transcript) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findById(courseId);
        if (!course) {
            console.error('Course not found');
            process.exit(1);
        }

        const lessonIndex = course.lessons.findIndex(l => l._id.toString() === lessonId);
        if (lessonIndex === -1) {
            console.error('Lesson not found');
            process.exit(1);
        }

        course.lessons[lessonIndex].transcript = transcript;
        await course.save();

        console.log(`Successfully updated transcript for lesson: "${course.lessons[lessonIndex].title}"`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

// Example usage: node addTranscript.js <courseId> <lessonId> "Transcript text here"
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node addTranscript.js <courseId> <lessonId> "<transcript>"');
    process.exit(1);
}

addTranscript(args[0], args[1], args[2]);
