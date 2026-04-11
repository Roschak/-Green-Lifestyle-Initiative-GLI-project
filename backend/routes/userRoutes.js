// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../config/multer');
const { protect } = require('../middleware/authMiddleware');

router.post('/actions', protect, upload.single('image'), userController.createAction);
router.get('/stats/:id', protect, userController.getUserStats);
router.get('/actions/:id', protect, userController.getUserActions);
router.get('/profile/:id', protect, userController.getUserProfile);
router.put('/profile/:id', protect, userController.updateUserProfile);  // ✅ NEW: Update profile
router.post('/profile/:id/avatar', protect, upload.single('avatar'), userController.uploadAvatar);  // ✅ NEW: Upload avatar
// ✅ Public leaderboard - users can view rankings without admin role
router.get('/leaderboard', userController.getPublicLeaderboard);
// ✅ NEW: Heartbeat - Update last_activity untuk auto-offline
router.post('/heartbeat', protect, userController.heartbeat);

module.exports = router;