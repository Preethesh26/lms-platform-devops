const express = require('express');
const { contactAdmin, getAllTickets, updateTicketStatus } = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/contact-admin', contactAdmin);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllTickets);
router.put('/:id', protect, authorize('admin'), updateTicketStatus);

module.exports = router;
