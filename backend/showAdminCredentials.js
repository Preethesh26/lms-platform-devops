require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const showAdminCredentials = async () => {
    try {
        await connectDB();

        const admin = await User.findOne({ role: 'admin' });

        if (admin) {
            console.log('\n=================================');
            console.log('ADMIN LOGIN CREDENTIALS:');
            console.log('=================================');
            console.log(`Email: ${admin.email}`);
            console.log(`Name: ${admin.name}`);
            console.log(`Password: admin123 (just reset)`);
            console.log('=================================\n');
        } else {
            console.log('No admin user found in database!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

showAdminCredentials();
