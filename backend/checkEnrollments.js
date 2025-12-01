require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkEnrollments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const users = await User.find({ role: 'user' }).select('name email enrolledCourses');

        console.log('\n--- Student Enrollments ---');
        if (users.length === 0) {
            console.log('No students found.');
        } else {
            users.forEach(user => {
                console.log(`User: ${user.name} (${user.email})`);
                console.log(`Enrolled Courses Count: ${user.enrolledCourses.length}`);
                console.log('---------------------------');
            });
        }
        console.log('---------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkEnrollments();
