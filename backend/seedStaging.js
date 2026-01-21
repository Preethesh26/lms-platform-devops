const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Setting = require('./models/Setting');

const seedStaging = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        // Connect to Staging DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Staging');

        // 1. Create Super Admin
        const adminEmail = 'superadmin@academypro.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log('Creating Super Admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'superadmin',
                enrollment: 'ADMIN-001',
                twoFactorEnabled: false,
                xp: 9999,
                level: 99,
                createdAt: new Date()
            });
            console.log('✨ Super Admin Created');
        } else {
            console.log('ℹ️ Super Admin already exists');
        }

        // 2. Create Default Settings (Key-Value Schema)
        const defaultSettings = [
            { key: 'siteName', value: 'AcademyPro Staging', description: 'Global site name' },
            { key: 'siteDescription', value: 'Staging Environment', description: 'Meta description' },
            { key: 'allowRegistration', value: true, description: 'Allow new users to match' },
            { key: 'maintenanceMode', value: false, description: 'Toggle maintenance mode' },
            { key: 'supportEmail', value: 'support@academypro.com', description: 'Contact email' },
            { key: 'features', value: { gamification: true, certificates: true, blog: true }, description: 'Enabled features' }
        ];

        console.log('Checking Default Settings...');

        for (const setting of defaultSettings) {
            const exists = await Setting.findOne({ key: setting.key });
            if (!exists) {
                await Setting.create(setting);
                console.log(`✨ Created setting: ${setting.key}`);
            } else {
                console.log(`ℹ️ Setting exists: ${setting.key}`);
            }
        }

        console.log('🎉 Seeding Complete! Exit in 3s...');
        setTimeout(() => process.exit(0), 3000);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedStaging();
