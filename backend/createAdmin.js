require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123';

        // Check if admin exists
        let admin = await User.findOne({ role: 'admin' });

        if (admin) {
            console.log(`Admin user found with email: ${admin.email}`);
            console.log('Updating password...');
            admin.password = adminPassword; // Will be hashed by pre-save hook
            await admin.save();
            console.log(`Admin password updated to: ${adminPassword}`);
        } else {
            console.log('Admin user not found. Creating new admin...');
            admin = await User.create({
                name: 'Administrator',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                enrollment: 'ADMIN001'
            });
            console.log(`Admin user created with email: ${adminEmail} and password: ${adminPassword}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
