const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    enrollCourse,
    bulkCreateUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
    .get(authorize('admin'), getUsers);

router.post('/bulk-upload', authorize('admin'), upload.single('file'), bulkCreateUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(authorize('admin'), deleteUser);

router.post('/:id/enroll', enrollCourse);

module.exports = router;

