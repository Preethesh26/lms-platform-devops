require('dotenv').config({ path: '.env' });
const { sendWelcomeEmail } = require('./services/emailService');

const testEmail = async () => {
    console.log('Testing Brevo email service...');
    console.log('API Key present:', process.env.BREVO_API_KEY ? 'Yes' : 'No');

    // Test with a different email to verify it works for ANY address
    const testEmailAddress = 'test@example.com'; // This will work with Brevo!

    try {
        console.log(`\nSending test email to: ${testEmailAddress}`);
        const result = await sendWelcomeEmail(
            testEmailAddress,
            'Test Student',
            'password123',
            'TEST001'
        );

        if (result.success) {
            console.log('✅ SUCCESS! Email sent successfully!');
            console.log('Message ID:', result.data.messageId);
            console.log('\n🎉 Brevo is working! You can now send emails to ANY address!');
        } else {
            console.log('❌ Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
};

testEmail();
