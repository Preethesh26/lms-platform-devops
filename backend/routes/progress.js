const express = require('express');
const { updateProgress, getCourseProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All progress routes require login

router.post('/update', updateProgress);
router.get('/:courseId', getCourseProgress);

module.exports = router;
