require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function clearStudentEnrollments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear enrolledCourses for all students (not admins)
        const result = await User.updateMany(
            { role: 'user' }, // Only students
            { $set: { enrolledCourses: [] } } // Clear their enrollments
        );

        console.log(`\n✅ Cleared enrollments for ${result.modifiedCount} students`);
        console.log('Students must now pay to access courses!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearStudentEnrollments();
