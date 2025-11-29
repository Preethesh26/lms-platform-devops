const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance = null;

if (process.env.BREVO_API_KEY) {
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
} else {
    console.warn("⚠️ BREVO_API_KEY is missing. Email features will not work.");
}

// Send password reset email
const sendPasswordResetEmail = async (to, resetUrl) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'kulalpreethesh20@gmail.com' };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = 'Password Reset Request';
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested to reset your password. Click the button below to reset it:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

// Send contact admin email
const sendContactAdminEmail = async (adminEmail, userEmail, userName, message) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'kulalpreethesh20@gmail.com' };
        sendSmtpEmail.to = [{ email: adminEmail }];
        sendSmtpEmail.replyTo = { email: userEmail, name: userName };
        sendSmtpEmail.subject = `Support Request from ${userName}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Support Request</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>From:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                <p style="color: #666; font-size: 14px;">You can reply directly to this email to respond to the user.</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email with credentials
const sendWelcomeEmail = async (to, name, password, enrollment) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'kulalpreethesh20@gmail.com' };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = 'Welcome to LMS Platform - Your Credentials';
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to LMS Platform, ${name}!</h2>
                <p>Your account has been created successfully. Here are your login credentials:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${to}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    ${enrollment ? `<p><strong>Enrollment Number:</strong> ${enrollment}</p>` : ''}
                </div>

                <a href="${loginUrl}/login" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login to Dashboard</a>
                
                <p style="color: #666; font-size: 14px;">Please change your password after your first login for security.</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendContactAdminEmail,
    sendWelcomeEmail
};
