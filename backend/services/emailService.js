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

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
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

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
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

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
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

// Send profile update notification email
const sendProfileUpdateEmail = async (to, name, changes) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Build list of changes
        let changesHtml = '';
        if (changes.name) changesHtml += `<li>Name updated</li>`;
        if (changes.email) changesHtml += `<li>Email address changed to: ${changes.email}</li>`;
        if (changes.role) changesHtml += `<li>Role changed to: ${changes.role === 'admin' ? 'Administrator' : 'Student'}</li>`;
        if (changes.password) changesHtml += `<li>Password has been reset</li>`;
        if (changes.enrollment) changesHtml += `<li>Enrollment number updated to: ${changes.enrollment}</li>`;

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = 'Your LMS Profile Has Been Updated';
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Profile Update Notification</h2>
                <p>Hello ${name},</p>
                <p>Your LMS account profile has been updated by an administrator. Here are the changes:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <ul style="list-style-type: none; padding: 0;">
                        ${changesHtml}
                    </ul>
                </div>

                ${changes.password ? `
                    <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> Your password has been reset. Please log in and change it immediately for security.</p>
                    </div>
                ` : ''}

                <a href="${loginUrl}/login" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login to Dashboard</a>
                
                <p style="color: #666; font-size: 14px;">If you have any questions about these changes, please contact your administrator.</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

// Send admin notification for new user registration
const sendAdminNewUserNotification = async (adminEmail, userName, userEmail, enrollmentNumber) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
        sendSmtpEmail.to = [{ email: adminEmail }];
        sendSmtpEmail.subject = `New Student Registration - ${userName}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New Student Registration</h2>
                <p>A new student has registered on the LMS platform:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${userName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${userEmail}</p>
                    <p style="margin: 8px 0;"><strong>Enrollment Number:</strong> ${enrollmentNumber}</p>
                    <p style="margin: 8px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p style="color: #666; font-size: 14px;">The student can now log in and enroll in courses.</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

// Send test invitation email
const sendTestInvitationEmail = async (to, testData) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform', email: 'academypro.desk@gmail.com' };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = `You're invited to take: ${testData.title}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Test Invitation</h2>
                <p>You have been invited to take the following test:</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${testData.title}</h3>
                    ${testData.description ? `<p>${testData.description}</p>` : ''}
                    
                    <p><strong>Questions:</strong> ${testData.questionCount}</p>
                    <p><strong>Time Limit:</strong> ${testData.timeLimit > 0 ? `${testData.timeLimit} minutes` : 'Unlimited'}</p>
                    <p><strong>Passing Score:</strong> ${testData.passingScore}%</p>
                    ${testData.deadline ? `<p><strong>Deadline:</strong> ${new Date(testData.deadline).toLocaleString()}</p>` : ''}
                </div>
                
                ${!testData.requiresAccountLogin && testData.password ? `
                <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #856404;">🔑 Your Access Credentials</h3>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${testData.email}</p>
                    <p style="margin: 10px 0;"><strong>Password:</strong> <span style="font-size: 20px; font-family: monospace; background: white; padding: 5px 10px; border-radius: 4px; color: #0070f3;">${testData.password}</span></p>
                    <p style="color: #856404; font-size: 14px; margin-top: 15px;">⚠️ Keep this password secure. You'll need it to access the test.</p>
                </div>
                ` : ''}
                
                ${testData.requiresAccountLogin ? `
                <div style="background: #e7f3ff; border: 2px solid #0070f3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #004085;"><strong>📝 Note:</strong> This test requires you to log in with your LMS account credentials.</p>
                </div>
                ` : ''}
                
                <p><strong>Important:</strong> You can only take this test once.</p>
                
                <a href="${testData.link}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                    Start Test
                </a>
                
                <p style="color: #666; font-size: 14px;">Or copy this link: ${testData.link}</p>
            </div>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};

// Send ticket status update email
const sendTicketStatusUpdateEmail = async (to, userName, ticketSubject, newStatus) => {
    if (!apiInstance) {
        console.error('Brevo API not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.sender = { name: 'LMS Platform Support', email: 'academypro.desk@gmail.com' };
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = `Update on your support request: ${ticketSubject}`;

        let statusColor = '#0070f3'; // Default blue
        if (newStatus === 'Resolved') statusColor = '#28a745'; // Green
        if (newStatus === 'In Progress') statusColor = '#17a2b8'; // Cyan

        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8f9fa; padding: 20px; border-bottom: 2px solid ${statusColor};">
                    <h2 style="color: #333; margin: 0;">Support Ticket Update</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Hello ${userName},</p>
                    <p>There has been an update to your support request:</p>
                    
                    <div style="background-color: #f1f3f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Subject:</strong> ${ticketSubject}</p>
                        <p style="margin: 10px 0 0 0;"><strong>New Status:</strong> <span style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold; font-size: 13px;">${newStatus.toUpperCase()}</span></p>
                    </div>

                    <p>The administrator is currently looking into your request or has marked it as resolved.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br>LMS Platform Support Team</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
                    This is an automated notification. Please do not reply directly to this email.
                </div>
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
    sendWelcomeEmail,
    sendProfileUpdateEmail,
    sendAdminNewUserNotification,
    sendTestInvitationEmail,
    sendTicketStatusUpdateEmail
};

