const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

// Multer configuration: Use memory storage so we can decide between local/cloud in the controller
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') ||
            file.mimetype === 'video/mp4' ||
            file.mimetype === 'video/webm' ||
            file.mimetype === 'video/quicktime') {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos (mp4, webm, mov) are allowed'), false);
        }
    }
});

// Only admins can upload thumbnails
router.post('/', protect, authorize('admin', 'org_superadmin', 'superadmin'), upload.single('image'), uploadImage);

module.exports = router;
