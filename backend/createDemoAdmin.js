require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const createDemoAdmin = async () => {
    try {
        await connectDB();

        const demoEmail = 'demo-admin@academypro.com';
        const demoPassword = 'demo1234';

        // Check if demo admin exists
        let demoAdmin = await User.findOne({ email: demoEmail });

        if (demoAdmin) {
            console.log(`Demo admin user found. Updating password...`);
            demoAdmin.password = demoPassword; // Will be hashed by pre-save hook
            await demoAdmin.save();
            console.log(`Demo admin password updated to: ${demoPassword}`);
        } else {
            console.log('Creating new Demo Admin...');
            demoAdmin = await User.create({
                name: 'Demo Principal',
                email: demoEmail,
                password: demoPassword,
                role: 'admin',
                enrollment: 'DEMO001'
            });
            console.log(`Demo user created with email: ${demoEmail} and password: ${demoPassword}`);
        }

        console.log('\n--- IMPORTANT ---');
        console.log('This user has special "Demo Mode" protection in the frontend.');
        console.log('Any POST/PUT/DELETE requests made by this user will be blocked by the API interceptor.');
        console.log('-----------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createDemoAdmin();
