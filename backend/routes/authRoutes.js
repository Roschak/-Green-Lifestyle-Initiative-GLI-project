// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/logout',   authController.logout);

// Route baru untuk Google Login
router.post('/google', authController.googleLogin);
// Route untuk Google Register
router.post('/google-register', authController.googleRegister);


module.exports = router;