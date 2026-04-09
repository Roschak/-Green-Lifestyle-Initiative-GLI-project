// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../config/multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create', protect, upload.single('thumbnail'), eventController.createEvent);
router.get('/', protect, eventController.getAllEvents);
router.get('/host/:user_id', protect, eventController.getHostEvents);
router.get('/my/:user_id', protect, eventController.getUserRegistrations);
router.post('/register', protect, eventController.registerToEvent);
router.post('/proof', protect, upload.single('proof'), eventController.uploadProof);
router.get('/:event_id/registrations', protect, adminOnly, eventController.getEventRegistrations);

module.exports = router;