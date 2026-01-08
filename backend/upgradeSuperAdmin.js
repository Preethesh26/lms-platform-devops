require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const upgradeToSuperAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'superadmin';
        await user.save();

        console.log(`Successfully upgraded ${email} to superadmin.`);
        process.exit(0);
    } catch (error) {
        console.error('Error upgrading user:', error);
        process.exit(1);
    }
};

// You can change the email here or pass it as an argument
const emailToUpgrade = process.argv[2] || 'admin@academypro.com';
upgradeToSuperAdmin(emailToUpgrade);
