require('dotenv').config({ path: '.env' });
const { sendWelcomeEmail } = require('./services/emailService');

const testEmail = async () => {
    console.log('Testing email with Resend API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

    try {
        const result = await sendWelcomeEmail(
            'kulalpreethesh20@gmail.com', // Your verified email
            'Test User',
            'testpassword123',
            'TEST001'
        );
        console.log('Email result:', result);
    } catch (error) {
        console.error('Email error:', error);
    }

    process.exit(0);
};

testEmail();
