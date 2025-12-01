require('dotenv').config();
const { sendAdminNewUserNotification } = require('./services/emailService');

async function testAdminNotification() {
    console.log('Testing admin notification email...');
    console.log('Admin Email:', process.env.ADMIN_NOTIFICATION_EMAIL);

    try {
        const result = await sendAdminNewUserNotification(
            process.env.ADMIN_NOTIFICATION_EMAIL,
            'Test User',
            'testuser@example.com',
            'ENR-2025-00001'
        );

        console.log('✅ Email sent successfully:', result);
    } catch (error) {
        console.error('❌ Email failed:', error);
    }
}

testAdminNotification();
