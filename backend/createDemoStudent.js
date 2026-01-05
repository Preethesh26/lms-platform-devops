require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createDemoStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if demo student already exists
        const existingStudent = await User.findOne({ email: 'demo-student@academypro.com' });

        if (existingStudent) {
            console.log('Demo student already exists!');
            console.log('Email: demo-student@academypro.com');
            console.log('Password: student123');
            process.exit(0);
        }

        // Create demo student
        const demoStudent = await User.create({
            name: 'Demo Student',
            email: 'demo-student@academypro.com',
            password: 'student123',
            enrollment: 'DEMO-2024-001',
            role: 'user',
            enrolledCourses: []
        });

        console.log('✅ Demo student created successfully!');
        console.log('Email: demo-student@academypro.com');
        console.log('Password: student123');
        console.log('Enrollment: DEMO-2024-001');

        process.exit(0);
    } catch (error) {
        console.error('Error creating demo student:', error);
        process.exit(1);
    }
};

createDemoStudent();
