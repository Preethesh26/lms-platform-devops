const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'admin1234';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    password: hashedPassword,
                    role: 'admin'
                }
            },
            { new: true }
        );

        if (updatedUser) {
            console.log('Admin password reset successfully for:', email);
        } else {
            console.log('Admin user not found, creating new one...');
            await User.create({
                name: 'Admin User',
                email,
                password: hashedPassword,
                role: 'admin',
                enrollmentNo: 'ADMIN001'
            });
            console.log('Admin created successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
};

resetAdmin();
