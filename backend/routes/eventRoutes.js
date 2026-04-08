// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../config/multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ============ PUBLIC ROUTES ============
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// ============ REGISTRATION (USER) ============
router.post('/register', protect, eventController.registerEvent);
router.post('/proof', protect, upload.single('proof'), eventController.uploadProof);

// ============ MY DATA ============
router.get('/my/:user_id', protect, eventController.getMyRegistrations);
router.get('/host/:host_id', protect, eventController.getMyEvents);
router.get('/check/:event_id/:user_id', protect, eventController.checkRegistration);

// ============ ADMIN / HOST ROUTES ============
router.post('/create', protect, adminOnly, upload.single('thumbnail'), eventController.createEvent);
router.post('/verify', protect, adminOnly, eventController.verifyProof);
router.get('/:id/registrations', protect, adminOnly, eventController.getEventRegistrations);

module.exports = router;