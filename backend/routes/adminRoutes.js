// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Rute Statis
router.get('/stats',        adminController.getDashboardStats);
router.get('/users',        adminController.getUsers);
router.get('/actions',      adminController.getAllActions);
router.get('/leaderboard',  adminController.getLeaderboard);

// ✅ Endpoint baru: statistik admin (total verifikasi dll)
router.get('/profile/stats', adminController.getAdminStats);

// 2. Rute Dinamis
router.get('/users/:id',    adminController.getUserDetail);
router.put('/actions/:id',  adminController.verifyAction);

module.exports = router;