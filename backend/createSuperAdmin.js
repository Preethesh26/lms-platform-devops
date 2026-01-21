const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const createSuperAdmin = async () => {
    try {
        // Connect to the database defined in MONGODB_URI
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'superadmin@academypro.com';
        const adminPassword = 'admin123'; // Standard password for demo

        // Check if admin already exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('⚠️ Super Admin already exists!');
            console.log('Email:', adminEmail);
            console.log('Role:', admin.role);

            // Optional: Update password if needed
            // admin.password = adminPassword;
            // await admin.save();
            // console.log('🔄 Password reset to:', adminPassword);
        } else {
            console.log('Creating new Super Admin...');

            admin = new User({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'superadmin',
                enrollment: 'ADMIN-001',
                twoFactorEnabled: false,
                xp: 9999,
                level: 99,
                createdAt: new Date()
            });

            await admin.save();
            console.log('🎉 Super Admin created successfully!');
            console.log('📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
