const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe } = require('../controllers/authController');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', authenticateUser, getMe);

module.exports = router;
