const express = require('express');
const { login, checkAdmin } = require('../controllers/authController');

const router = express.Router();

// Öğrenci girişi
router.post('/login', login);

// Admin kontrolü
router.get('/admin/:studentId', checkAdmin);

module.exports = router;