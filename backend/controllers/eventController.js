// backend/controllers/eventController.js
// Handles all event-related operations: creation, registration, status tracking, and attendance management
const db = require('../config/db');
const admin = require('firebase-admin');

/**
 * Calculate Event Status based on current time and event schedule
 * LOGIC:
 * - Before registration_end → "roundown" (Pendaftaran)
 * - After registration_end, before event_start → "roundown" (Countdown menunggu mulai)
 * - During event (event_start to event_end) → "dilaksanakan" (Berlangsung)
 * - After event_end → "berakhir" (Berakhir)
 */
const calculateEventStatus = (eventData) => {
    const now = new Date();
    const regStart = new Date(eventData.registration_start);
    const regEnd = new Date(eventData.registration_end);
    const evStart = new Date(eventData.event_start);
    const evEnd = new Date(eventData.event_end);

    if (now < regEnd) {
        return 'roundown';  // Registration open
    } else if (now < evStart) {
        return 'roundown';  // Waiting for event to start
    } else if (now < evEnd) {
        return 'dilaksanakan';  // Event is ongoing
    } else {
        return 'berakhir';  // Event ended
    }
};

/**
 * Create Event - Endpoint untuk membuat event baru
 * Validasi input (title, description, location, dates)
 * Set approval_status = 'pending' untuk admin review
 * Host bisa user atau admin - akan diverifikasi sebelum tampil ke public
 */
exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, location, wa_link, medal_name,
            registration_start, registration_end, event_start, event_end,
            thumbnail_type, thumbnail_text, thumbnail_color
        } = req.body;

        // Validasi required fields
        if (!title || !description || !location) {
            return res.status(400).json({ success: false, message: 'Judul, deskripsi, dan lokasi wajib diisi' });
        }

        // Parse dan validasi tanggal
        const regStart = new Date(registration_start);
        const regEnd = new Date(registration_end);
        const evStart = new Date(event_start);
        const evEnd = new Date(event_end);

        if (isNaN(regStart) || isNaN(regEnd) || isNaN(evStart) || isNaN(evEnd)) {
            return res.status(400).json({ success: false, message: 'Format tanggal tidak valid' });
        }

        // Validasi logika tanggal (mulai harus sebelum akhir)
        if (regStart >= regEnd) {
            return res.status(400).json({ success: false, message: 'Waktu registrasi tidak valid' });
        }

        // Upload thumbnail jika ada
        let thumbnailUrl = null;
        if (req.file) {
            thumbnailUrl = req.file.path;
        }

        // Ambil info host dari auth token
        const host_id = req.user?.id;
        const host_role = req.user?.role || 'user';

        if (!host_id) {
            return res.status(401).json({ success: false, message: 'User tidak teridentifikasi' });
        }

        // Simpan event ke Firestore dengan approval_status = pending
        const eventData = {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            wa_link: wa_link || '',
            medal_name: medal_name || 'Medali Sosialisasi',
            thumbnail_type: thumbnail_type || 'image',
            thumbnail_text: thumbnail_text || '',
            thumbnail_color: thumbnail_color || '#22c55e',
            host_id: host_id,
            host_role: host_role,
            approval_status: 'pending',  // Harus di-approve admin dulu
            approval_date: null,
            admin_notes: '',
            status: 'roundown',  // countdown status
            registration_start: regStart,
            registration_end: regEnd,
            event_start: evStart,
            event_end: evEnd,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        // Only add thumbnail if uploaded
        if (thumbnailUrl) {
            eventData.thumbnail = thumbnailUrl;
        }

        const docRef = await db.collection('events').add(eventData);

        console.log('📝 Event dibuat (menunggu approval):', docRef.id);

        return res.status(201).json({
            success: true,
            message: 'Event berhasil dibuat! Menunggu persetujuan admin.',
            eventId: docRef.id,
            approvalStatus: 'pending'
        });

    } catch (err) {
        console.error('❌ Create Event Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const snap = await db.collection('events').orderBy('created_at', 'desc').get();
        const events = [];

        snap.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
            if (data.registration_start?.toDate) data.registration_start = data.registration_start.toDate().toISOString();
            if (data.registration_end?.toDate) data.registration_end = data.registration_end.toDate().toISOString();
            if (data.event_start?.toDate) data.event_start = data.event_start.toDate().toISOString();
            if (data.event_end?.toDate) data.event_end = data.event_end.toDate().toISOString();

            // ✅ FIXED: Calculate status based on current time
            const dataForStatusCalc = {
                registration_start: data.registration_start,
                registration_end: data.registration_end,
                event_start: data.event_start,
                event_end: data.event_end
            };
            data.status = calculateEventStatus(dataForStatusCalc);

            events.push({ id: doc.id, ...data });
        });

        console.log(`✅ getAllEvents:`, JSON.stringify(events).substring(0, 200));
        return res.json(events);

    } catch (err) {
        console.error('❌ Get All Events Error:', err.code, '-', err.message);

        // If index error, try without orderBy as fallback
        if (err.code === 9 || err.code === '9' || err.message?.includes('FAILED_PRECONDITION')) {
            try {
                console.log('📌 Retrying getAllEvents without orderBy...');
                const snapshot = await db.collection('events').get();
                const events = [];

                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
                    if (data.registration_start?.toDate) data.registration_start = data.registration_start.toDate().toISOString();
                    if (data.registration_end?.toDate) data.registration_end = data.registration_end.toDate().toISOString();
                    if (data.event_start?.toDate) data.event_start = data.event_start.toDate().toISOString();
                    if (data.event_end?.toDate) data.event_end = data.event_end.toDate().toISOString();

                    // ✅ FIXED: Calculate status based on current time
                    const dataForStatusCalc = {
                        registration_start: data.registration_start,
                        registration_end: data.registration_end,
                        event_start: data.event_start,
                        event_end: data.event_end
                    };
                    data.status = calculateEventStatus(dataForStatusCalc);

                    events.push({ id: doc.id, ...data });
                });

                // Sort in memory
                events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                console.log(`✅ getAllEvents (fallback):`, JSON.stringify(events).substring(0, 200));
                return res.json(events);
            } catch (fallbackErr) {
                console.error('❌ Fallback error:', fallbackErr);
                return res.json([]);
            }
        }
        return res.json([]);
    }
};

/**
 * Register to Event - Endpoint untuk register ke event
 * Mendukung guest (tanpa akun) dan member (dengan akun Firebase)
 * Cek duplicate email untuk avoid multiple registrations
 * Return WA link untuk guest/member bisa langsung join grup
 */
exports.registerToEvent = async (req, res) => {
    try {
        const { event_id, user_id, name, email, phone, is_gli_member } = req.body;

        // Cek apakah email sudah terdaftar di event ini
        const existing = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar di event ini' });
        }

        // Ambil data event untuk return wa_link dan event info
        const eventDoc = await db.collection('events').doc(event_id).get();
        const eventData = eventDoc.data();

        // Simpan registration dengan initial status pending
        const docRef = await db.collection('event_registrations').add({
            event_id: event_id || '',
            user_id: user_id || '',  // Kosong untuk guest
            name: name || '',
            email: email || '',
            phone: phone || '',
            is_gli_member: is_gli_member ? 1 : 0,  // 0 = guest, 1 = member
            proof_img: null,  // Diisi saat upload foto
            proof_status: 'pending',
            medal_awarded: false,
            registered_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Registration created:', docRef.id);

        return res.status(201).json({
            success: true,
            message: 'Berhasil mendaftar event!',
            registrationId: docRef.id,
            event_title: eventData?.title || '',
            is_gli_member: is_gli_member ? 1 : 0,
            medal_name: eventData?.medal_name || 'Medali Digital GLI',
            wa_link: eventData?.wa_link || null, // ✅ Return WA link immediately
            event_status: eventData?.status || 'roundown'
        });

    } catch (err) {
        console.error('❌ Register Event Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Upload Proof - Upload bukti kehadiran (foto) untuk event
 * File diupload ke server/Cloudinary via Multer middleware
 * Set proof_status = 'pending' menunggu admin verification
 */
exports.uploadProof = async (req, res) => {
    try {
        const { registration_id } = req.body;
        let proofUrl = null;

        // Validasi file upload
        if (req.file) {
            proofUrl = req.file.path;
            console.log('✅ Proof uploaded:', proofUrl);
        } else {
            return res.status(400).json({ success: false, message: 'Gambar wajib diupload' });
        }

        // Simpan proof URL dan status ke registration
        await db.collection('event_registrations').doc(registration_id).update({
            proof_img: proofUrl,
            proof_status: 'pending'  // Tunggu admin verify
        });

        console.log('✅ Proof uploaded for registration:', registration_id);

        return res.json({
            success: true,
            message: 'Bukti kehadiran berhasil diupload!'
        });

    } catch (err) {
        console.error('❌ Upload Proof Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Get Event Registrations - Ambil semua registrasi untuk suatu event
 * Digunakan oleh admin untuk lihat siapa aja yang udah register
 */
exports.getEventRegistrations = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Query semua registrations dengan event_id tertentu
        const snap = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .get();

        const registrations = [];
        snap.forEach(doc => {
            registrations.push({ id: doc.id, ...doc.data() });
        });

        return res.json(registrations);

    } catch (err) {
        console.error('❌ Get Event Registrations Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getHostEvents = async (req, res) => {
    try {
        const { user_id } = req.params;
        console.log(`🔍 getHostEvents: Looking for events with host_id="${user_id}"`);

        const snap = await db.collection('events')
            .where('host_id', '==', user_id)
            .orderBy('created_at', 'desc')
            .get();

        console.log(`📊 Found ${snap.size} events for host_id="${user_id}"`);
        const events = { roundown: [], dilaksanakan: [], berakhir: [] };
        snap.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
            if (data.registration_start?.toDate) data.registration_start = data.registration_start.toDate().toISOString();
            if (data.registration_end?.toDate) data.registration_end = data.registration_end.toDate().toISOString();
            if (data.event_start?.toDate) data.event_start = data.event_start.toDate().toISOString();
            if (data.event_end?.toDate) data.event_end = data.event_end.toDate().toISOString();

            const eventWithId = { id: doc.id, ...data };
            // ✅ FIXED: Calculate status based on current time, not stored status
            const status = calculateEventStatus(data);
            if (events[status]) events[status].push(eventWithId);
        });

        console.log(`✅ getHostEvents for ${user_id}:`, JSON.stringify(events));
        return res.json(events);
    } catch (err) {
        console.error('❌ Get Host Events Error:', err.code, '-', err.message);

        // If index error, try without orderBy as fallback
        if (err.code === 9 || err.code === '9' || err.message?.includes('FAILED_PRECONDITION')) {
            try {
                console.log('📌 Retrying without orderBy...');
                const snapshot = await db.collection('events')
                    .where('host_id', '==', req.params.user_id)
                    .get();

                const events = { roundown: [], dilaksanakan: [], berakhir: [] };
                const docsArray = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Convert timestamps
                    if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
                    if (data.registration_start?.toDate) data.registration_start = data.registration_start.toDate().toISOString();
                    if (data.registration_end?.toDate) data.registration_end = data.registration_end.toDate().toISOString();
                    if (data.event_start?.toDate) data.event_start = data.event_start.toDate().toISOString();
                    if (data.event_end?.toDate) data.event_end = data.event_end.toDate().toISOString();
                    docsArray.push({ id: doc.id, ...data });
                });

                // Sort in memory
                docsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                docsArray.forEach(eventWithId => {
                    // ✅ FIXED: Calculate status based on current time
                    const status = calculateEventStatus(eventWithId);
                    if (events[status]) events[status].push(eventWithId);
                });

                console.log(`✅ getHostEvents (fallback) for ${req.params.user_id}:`, JSON.stringify(events));
                return res.json(events);
            } catch (fallbackErr) {
                console.error('❌ Fallback error:', fallbackErr);
                // Always return proper structure even on error
                return res.json({ roundown: [], dilaksanakan: [], berakhir: [] });
            }
        }
        // Always return proper structure
        console.error('❌ Returning fallback structure due to error');
        return res.json({ roundown: [], dilaksanakan: [], berakhir: [] });
    }
};

exports.getUserRegistrations = async (req, res) => {
    try {
        const { user_id } = req.params;

        const snap = await db.collection('event_registrations')
            .where('user_id', '==', user_id)
            .get();

        const registrations = [];
        for (const doc of snap.docs) {
            const regData = doc.data();
            
            // Fetch event details for this registration
            const eventDoc = await db.collection('events').doc(regData.event_id).get();
            const eventData = eventDoc.data();
            
            if (eventData) {
                // Merge event details with registration
                const merged = {
                    id: doc.id,
                    ...regData,
                    // Event details
                    title: eventData.title || '',
                    location: eventData.location || 'Online',
                    event_status: calculateEventStatus(eventData),
                    event_start: eventData.event_start?.toDate?.() || eventData.event_start || '',
                    event_end: eventData.event_end?.toDate?.() || eventData.event_end || '',
                    wa_link: eventData.wa_link || null,
                    thumbnail_type: eventData.thumbnail_type || 'color',
                    thumbnail_text: eventData.thumbnail_text || '',
                    thumbnail_color: eventData.thumbnail_color || '#6366F1'
                };
                
                // Convert registration timestamps
                if (merged.registered_at?.toDate) merged.registered_at = merged.registered_at.toDate().toISOString();
                if (merged.event_start?.toDate) merged.event_start = merged.event_start.toDate().toISOString();
                if (merged.event_end?.toDate) merged.event_end = merged.event_end.toDate().toISOString();
                
                registrations.push(merged);
            }
        }

        return res.json(registrations);
    } catch (err) {
        console.error('❌ Get User Registrations Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// NEW: Upload attendance proof (camera-based)
exports.uploadAttendanceProof = async (req, res) => {
    try {
        const { event_id, registration_id } = req.body;

        if (!event_id || !registration_id) {
            return res.status(400).json({
                success: false,
                message: 'event_id dan registration_id wajib'
            });
        }

        let proofUrl = null;
        if (req.file) {
            proofUrl = req.file.path;
            console.log('✅ Attendance proof uploaded:', proofUrl);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Foto bukti kehadiran wajib diupload'
            });
        }

        // Check if already uploaded
        const existing = await db.collection('attendance_proofs')
            .where('registration_id', '==', registration_id)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah mengunggah bukti kehadiran'
            });
        }

        // Create attendance proof
        const docRef = await db.collection('attendance_proofs').add({
            event_id: event_id,
            registration_id: registration_id,
            photo_url: proofUrl,
            status: 'approved', // Auto-approve
            attended: true, // Mark as attended
            uploaded_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update registration proof status
        await db.collection('event_registrations').doc(registration_id).update({
            proof_img: proofUrl,
            proof_status: 'approved',
            attended: true
        });

        console.log('✅ Attendance recorded:', docRef.id);

        return res.status(201).json({
            success: true,
            message: 'Kehadiran berhasil dicatat!',
            proofId: docRef.id,
            attended: true
        });

    } catch (err) {
        console.error('❌ Upload Attendance Proof Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Get Attendance List - Ambil list attendance untuk host/admin
 * Combine registration data dengan proof photos
 * Hitung total attended vs not attended
 */
exports.getAttendanceList = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Validasi event exists
        const eventDoc = await db.collection('events').doc(event_id).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
        }

        // Ambil semua registrations untuk event ini
        const regsSnap = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .get();

        const attendanceList = [];

        // Loop setiap registration, cek apakah ada proof photo
        for (const regDoc of regsSnap.docs) {
            const regData = regDoc.data();

            // Check if proof uploaded ke attendance_proofs
            const proofSnap = await db.collection('attendance_proofs')
                .where('registration_id', '==', regDoc.id)
                .limit(1)
                .get();

            let proofData = null;
            if (!proofSnap.empty) {
                proofData = proofSnap.docs[0].data();
            }

            attendanceList.push({
                registration_id: regDoc.id,
                name: regData.name,
                email: regData.email,
                phone: regData.phone || '',
                is_member: regData.is_gli_member === 1,
                status: proofData ? 'attended' : 'not_attended',  // attended jika ada proof
                photo_url: proofData?.photo_url || null,
                uploaded_at: proofData?.uploaded_at?.toDate?.().toISOString() || null
            });
        }

        return res.json({
            success: true,
            event_id: event_id,
            event_title: eventDoc.data().title,
            total: attendanceList.length,
            attended_count: attendanceList.filter(a => a.status === 'attended').length,
            data: attendanceList
        });

    } catch (err) {
        console.error('❌ Get Attendance List Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Check Event Status - Endpoint untuk frontend polling timer countdown
 * Hitung sisa waktu sampai event_end
 * Return is_closed = true jika event sudah berakhir
 * Frontend poll setiap 1 detik untuk update countdown
 */
exports.checkEventStatus = async (req, res) => {
    try {
        const { event_id } = req.params;

        // Validasi event exists
        const eventDoc = await db.collection('events').doc(event_id).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
        }

        const eventData = eventDoc.data();
        const now = new Date();
        const eventEnd = eventData.event_end?.toDate?.() || new Date(eventData.event_end);

        // Auto-close if event ended
        let status = eventData.status;
        if (now > eventEnd && status !== 'berakhir') {
            await db.collection('events').doc(event_id).update({
                status: 'berakhir',
                closed_at: admin.firestore.FieldValue.serverTimestamp()
            });
            status = 'berakhir';
        }

        const timeRemaining = Math.max(0, Math.floor((eventEnd - now) / 1000));

        return res.json({
            success: true,
            event_id: event_id,
            status: status,
            event_end: eventEnd.toISOString(),
            time_remaining_seconds: timeRemaining,
            is_closed: timeRemaining === 0 || status === 'berakhir'
        });

    } catch (err) {
        console.error('❌ Check Event Status Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ NEW: Admin approve/reject events
exports.approveEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { approval_status, admin_notes } = req.body;

        if (!['approved', 'rejected'].includes(approval_status)) {
            return res.status(400).json({ success: false, message: 'Status tidak valid' });
        }

        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
        }

        await eventRef.update({
            approval_status,
            admin_notes: admin_notes || '',
            approval_date: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Event ${approval_status}:`, eventId);

        return res.json({
            success: true,
            message: `Event berhasil di${approval_status === 'approved' ? 'setujui' : 'tolak'}`
        });

    } catch (err) {
        console.error('❌ Approve Event Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ NEW: Get pending events (admin)
exports.getPendingEvents = async (req, res) => {
    try {
        const snap = await db.collection('events')
            .where('approval_status', '==', 'pending')
            .orderBy('created_at', 'desc')
            .get();

        const events = [];
        for (const doc of snap.docs) {
            const data = doc.data();
            const hostDoc = await db.collection('users').doc(data.host_id).get();
            events.push({
                id: doc.id,
                title: data.title,
                host_name: hostDoc.exists ? hostDoc.data().name : 'Unknown',
                created_at: data.created_at?.toDate?.().toISOString() || '',
                ...data
            });
        }

        return res.json({
            success: true,
            pending_count: events.length,
            data: events
        });

    } catch (err) {
        console.error('❌ Get Pending Events Error:', err);
        return res.json({ success: true, pending_count: 0, data: [] });
    }
};

// ✅ NEW: Auto-delete old photos (2+ days after event completion)
exports.cleanupOldPhotos = async (req, res) => {
    try {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        // Find completed events older than 2 days
        const snapshot = await db.collection('actions')
            .where('status', '==', 'approved')
            .where('updated_at', '<', twoDaysAgo)
            .get();

        let deletedCount = 0;

        for (const doc of snapshot.docs) {
            const action = doc.data();
            if (action.img) {
                try {
                    // Update Firestore - remove photo URL, keep metadata
                    await doc.ref.update({
                        img: null,
                        photo_deleted_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    deletedCount++;
                    console.log('🗑️ Photo deleted (old action):', doc.id);
                } catch (err) {
                    console.error('⚠️ Error deleting photo:', err.message);
                }
            }
        }

        return res.json({
            success: true,
            deleted: deletedCount,
            message: `${deletedCount} foto lama berhasil dihapus`
        });

    } catch (err) {
        console.error('❌ Cleanup Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}