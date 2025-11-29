const express = require('express');
const { contactAdmin } = require('../controllers/supportController');

const router = express.Router();

router.post('/contact-admin', contactAdmin);

module.exports = router;
