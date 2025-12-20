const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

// Multer configuration: Use memory storage so we can decide between local/cloud in the controller
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Only admins can upload thumbnails
router.post('/', protect, authorize('admin'), upload.single('image'), uploadImage);

module.exports = router;
