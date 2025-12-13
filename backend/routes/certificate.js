const express = require('express');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
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
// Generates a simple PDF certificate if the user has completed all lessons
router.get('/:courseId', async (req, res) => {
    try {
        const user = req.user;
        const courseId = req.params.courseId;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
        if (totalLessons === 0) return res.status(400).json({ success: false, message: 'Course has no lessons' });

        const completedCount = await Progress.countDocuments({ user: user._id, course: courseId, completed: true });

        if (completedCount < totalLessons) {
            return res.status(403).json({ success: false, message: 'Course not yet completed' });
        }

        // Create PDF certificate
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

        // Stream the PDF back to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${courseId}.pdf"`);
        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Border
        doc.lineWidth(2).rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();

        // Title
        doc.fontSize(40).text('Certificate of Completion', { align: 'center', valign: 'top' });

        doc.moveDown(1.5);
        doc.fontSize(18).text('This is to certify that', { align: 'center' });

        doc.moveDown(0.5);
        doc.font('Times-Bold').fontSize(32).text(user.name || user.email, { align: 'center' });

        doc.moveDown(0.5);
        doc.font('Times-Roman').fontSize(16).text('has successfully completed the course', { align: 'center' });

        doc.moveDown(0.5);
        doc.font('Times-Bold').fontSize(26).text(course.title, { align: 'center' });

        // Date and signature area
        const dateText = new Date().toLocaleDateString();
        doc.font('Times-Roman').fontSize(12).text(`Date: ${dateText}`, 60, pageHeight - 100);

        doc.fontSize(12).text('Signature:', pageWidth - 260, pageHeight - 120);
        doc.moveTo(pageWidth - 260, pageHeight - 90).lineTo(pageWidth - 60, pageHeight - 90).stroke();

        doc.end();
    } catch (err) {
        console.error('Certificate generation error:', err);
        res.status(500).json({ success: false, message: 'Server error while generating certificate' });
    }
});

module.exports = router;
