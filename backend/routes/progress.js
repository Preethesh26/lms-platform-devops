const express = require('express');
const { updateProgress, getCourseProgress, getAllUserProgress, adminUpdateCourseProgress } = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All progress routes require login

router.post('/update', updateProgress);
router.get('/all', getAllUserProgress);
router.post('/admin/update-course', authorize('admin', 'org_superadmin', 'superadmin'), adminUpdateCourseProgress);
router.get('/:courseId', getCourseProgress);

module.exports = router;
