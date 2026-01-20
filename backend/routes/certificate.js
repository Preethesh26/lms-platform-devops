const express = require('express');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { protect } = require('../middleware/auth');
let PDFDocument;
try {
    PDFDocument = require('pdfkit');
} catch (e) {
    console.warn("pdfkit not found, certificate generation will fail");
}

const router = express.Router();

// All certificate routes require authentication
router.use(protect);

// GET /api/certificate/:courseId
// Generates a professional PDF certificate
router.get('/:courseId', async (req, res) => {
    try {
        const user = req.user;
        const courseId = req.params.courseId;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        console.log(`[CERTIFICATE] Generating NEW PREMIUM certificate for user: ${user.name || user.email}, Course: ${course.title}`);

        const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
        if (totalLessons === 0) return res.status(400).json({ success: false, message: 'Course has no lessons' });

        const completedCount = await Progress.countDocuments({ user: user._id, course: courseId, completed: true });

        // Check if all lessons are completed
        if (completedCount < totalLessons) {
            return res.status(403).json({
                success: false,
                requirement: 'lessons_complete',
                message: `You have only completed ${completedCount} out of ${totalLessons} lessons. Please complete all lessons to unlock your certificate.`
            });
        }

        // --- Granular Quiz Pass Verification ---
        // Find all quizzes that belong to this course
        const allQuizzes = await Quiz.find({ course: courseId });

        if (allQuizzes.length > 0) {
            const quizIds = allQuizzes.map(q => q._id);

            // For each quiz, check if the user has at least one passed attempt
            for (const quizId of quizIds) {
                const hasPassed = await QuizAttempt.findOne({
                    user: user._id,
                    quiz: quizId,
                    passed: true
                });

                if (!hasPassed) {
                    const quiz = allQuizzes.find(q => q._id.toString() === quizId.toString());
                    const quizLesson = course.lessons.find(l => l.quizId?.toString() === quizId.toString());

                    return res.status(403).json({
                        success: false,
                        requirement: 'quiz_pass',
                        lessonId: quizLesson ? quizLesson._id : null,
                        message: `Requirement Unmet: You must pass the quiz "${quiz.title}" with a score of ${quiz.passingScore}% or higher to unlock this certificate.`
                    });
                }
            }
        }

        // --- Certificate Design Constants ---
        const COLORS = {
            NAVY: '#1a237e',
            GOLD: '#ffd700',
            CREAM: '#fefcf5', // Very light parchment
            DARK_GREY: '#333333',
            BRONZE: '#cd7f32'
        };

        // Create PDF
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 }); // 0 margin to draw full background

        // Stream response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificate-${course.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
        doc.pipe(res);

        const width = doc.page.width;
        const height = doc.page.height;

        // 1. Background Fill (Cream)
        doc.rect(0, 0, width, height).fill(COLORS.CREAM);

        // 2. Decorative Border
        const borderPadding = 20;
        const borderThickness = 10;

        // Outer Navy Border
        doc.lineWidth(borderThickness)
            .rect(borderPadding, borderPadding, width - (borderPadding * 2), height - (borderPadding * 2))
            .stroke(COLORS.NAVY);

        // Inner Gold Border (Thinner)
        doc.lineWidth(2)
            .rect(borderPadding + 8, borderPadding + 8, width - ((borderPadding + 8) * 2), height - ((borderPadding + 8) * 2))
            .stroke(COLORS.GOLD);

        // Corner Ornaments (Simple geometric accents)
        const cornerSize = 40;
        doc.save();
        doc.lineWidth(4).strokeColor(COLORS.NAVY);
        // Top-Left
        doc.moveTo(borderPadding + 15, borderPadding + cornerSize)
            .lineTo(borderPadding + 15, borderPadding + 15)
            .lineTo(borderPadding + cornerSize, borderPadding + 15)
            .stroke();
        // Top-Right
        doc.moveTo(width - borderPadding - 15, borderPadding + cornerSize)
            .lineTo(width - borderPadding - 15, borderPadding + 15)
            .lineTo(width - borderPadding - cornerSize, borderPadding + 15)
            .stroke();
        // Bottom-Left
        doc.moveTo(borderPadding + 15, height - borderPadding - cornerSize)
            .lineTo(borderPadding + 15, height - borderPadding - 15)
            .lineTo(borderPadding + cornerSize, height - borderPadding - 15)
            .stroke();
        // Bottom-Right
        doc.moveTo(width - borderPadding - 15, height - borderPadding - cornerSize)
            .lineTo(width - borderPadding - 15, height - borderPadding - 15)
            .lineTo(width - borderPadding - cornerSize, height - borderPadding - 15)
            .stroke();
        doc.restore();


        // 3. Content - Centered Text
        let yPos = 120;

        // Header
        doc.font('Helvetica-Bold')
            .fontSize(36)
            .fillColor(COLORS.NAVY)
            .text('CERTIFICATE OF COMPLETION', 0, yPos, { align: 'center', characterSpacing: 2 });

        yPos += 50;

        // Sub-header
        doc.font('Times-Italic')
            .fontSize(18)
            .fillColor(COLORS.DARK_GREY)
            .text('This is to certify that', 0, yPos, { align: 'center' });

        yPos += 40;

        // Student Name (Prominent)
        doc.font('Times-BoldItalic')
            .fontSize(42)
            .fillColor(COLORS.BRONZE)
            .text(user.name || user.email, 0, yPos, { align: 'center' });

        yPos += 15;
        // Underline for name
        const textWidth = doc.widthOfString(user.name || user.email);
        const startX = (width - textWidth) / 2;
        doc.lineWidth(1)
            .moveTo(startX - 20, yPos + 45)
            .lineTo(startX + textWidth + 20, yPos + 45)
            .stroke(COLORS.GOLD);

        yPos += 70;

        // Achievement Text
        doc.font('Times-Roman')
            .fontSize(16)
            .fillColor(COLORS.DARK_GREY)
            .text('Has successfully completed the comprehensive course', 0, yPos, { align: 'center' });

        yPos += 30;

        // Course Title
        doc.font('Helvetica-Bold')
            .fontSize(28)
            .fillColor(COLORS.NAVY)
            .text(course.title, 0, yPos, { align: 'center' });

        // 4. Footer Section (Date & Signature)
        const footerY = height - 130;
        const dateText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Left: Date
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.NAVY)
            .text('DATE', 100, footerY);
        doc.font('Helvetica').fontSize(14).fillColor(COLORS.DARK_GREY)
            .text(dateText, 100, footerY + 20);

        // Right: Signature
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.NAVY)
            .text('INSTRUCTOR', width - 250, footerY);

        // Mock Signature Script font fallback to Italic
        doc.font('Times-BoldItalic').fontSize(20).fillColor(COLORS.BRONZE)
            .text('LMS Platform Instructor', width - 250, footerY + 20);

        // 5. Gold Seal (Vector Badge) - Bottom Center
        doc.save();
        const badgeX = width / 2;
        const badgeY = height - 90;
        const badgeRadius = 35;

        // Starburst shape
        doc.translate(badgeX, badgeY);
        doc.fillColor(COLORS.GOLD);

        // Draw starburst
        const spikes = 20;
        const outerRadius = badgeRadius;
        const innerRadius = badgeRadius - 5;

        doc.path('M 0 ' + (-outerRadius)); // Start top
        for (let i = 0; i < spikes; i++) {
            let step = Math.PI / spikes;
            let angle = i * 2 * step;

            // Outer spike
            let x = Math.sin(angle) * outerRadius;
            let y = -Math.cos(angle) * outerRadius;
            doc.lineTo(x, y);

            // Inner valley
            angle += step;
            x = Math.sin(angle) * innerRadius;
            y = -Math.cos(angle) * innerRadius;
            doc.lineTo(x, y);
        }
        doc.closePath().fill();

        // Inner circle for seal text
        doc.fillColor(COLORS.NAVY).circle(0, 0, badgeRadius - 10).fill();

        // Text inside seal
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.GOLD)
            .text('OFFICIAL', -20, -10, { width: 40, align: 'center' })
            .text('CERTIFIED', -20, 2, { width: 40, align: 'center' });

        doc.restore();

        doc.end();

    } catch (err) {
        console.error('Certificate generation error:', err);
        res.status(500).json({ success: false, message: 'Server error while generating certificate' });
    }
});

module.exports = router;
