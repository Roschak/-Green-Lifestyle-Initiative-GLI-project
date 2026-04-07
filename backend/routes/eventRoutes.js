// routes/eventRoutes.js
//const express = require('express');
const express = require('express'); 
const router  = express.Router();
const eventController = require('../controllers/eventController');
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

// ✅ PENTING: Rute STATIS harus di atas rute DINAMIS (:id)

// PUBLIC
router.get('/',                 eventController.getAllEvents);
router.post('/register',        eventController.registerEvent);

// PROTECTED — statis
router.post('/create',  protect, upload.single('thumbnail'), eventController.createEvent);
router.post('/proof',   protect, upload.single('proof'),     eventController.uploadProof);
router.post('/verify',  protect,                             eventController.verifyProof);

router.get('/host/:host_id',    protect, eventController.getMyEvents);
router.get('/my/:user_id',      protect, eventController.getMyRegistrations);
router.get('/check/:event_id/:user_id', protect, eventController.checkRegistration);

// DINAMIS — paling bawah
router.get('/:id',              eventController.getEventById);
router.get('/:id/registrations', protect, eventController.getEventRegistrations);

module.exports = router;