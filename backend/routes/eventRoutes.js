// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const exportController = require('../controllers/exportController');
const upload = require('../config/multer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create', protect, upload.single('thumbnail'), eventController.createEvent);
router.get('/', eventController.getAllEvents); // ✅ Public - no auth needed
router.get('/host/:user_id', protect, eventController.getHostEvents);
router.get('/my/:user_id', protect, eventController.getUserRegistrations);
router.post('/register', eventController.registerToEvent); // ✅ Public - allow guest registration
router.post('/proof', protect, upload.single('proof'), eventController.uploadProof);
router.get('/:event_id/registrations', protect, eventController.getEventRegistrations);

// NEW: Attendance proof system
router.post('/:event_id/proof/upload', protect, upload.single('proof'), eventController.uploadAttendanceProof);
router.get('/:event_id/attendance', protect, eventController.getAttendanceList);
router.get('/:event_id/status', eventController.checkEventStatus);

// NEW: Export functionality
router.get('/:event_id/export/excel', protect, adminOnly, exportController.exportAttendanceExcel);
router.get('/:event_id/export/pdf', protect, adminOnly, exportController.exportAttendancePDF);

// NEW: Event approval system (admin)
router.put('/:eventId/approve', protect, adminOnly, eventController.approveEvent);
router.get('/admin/pending', protect, adminOnly, eventController.getPendingEvents);

// NEW: Photo cleanup
router.post('/admin/cleanup-photos', protect, adminOnly, eventController.cleanupOldPhotos);

module.exports = router;