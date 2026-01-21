const { updateProgress, getCourseProgress, getAllUserProgress, adminUpdateCourseProgress } = require('../controllers/progressController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All progress routes require login

router.post('/update', updateProgress);
router.get('/all', getAllUserProgress);
router.post('/admin/update-course', admin, adminUpdateCourseProgress);
router.get('/:courseId', getCourseProgress);

module.exports = router;
