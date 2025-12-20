const express = require('express');
const { updateProgress, getCourseProgress, getAllUserProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All progress routes require login

router.post('/update', updateProgress);
router.get('/all', getAllUserProgress);
router.get('/:courseId', getCourseProgress);

module.exports = router;
