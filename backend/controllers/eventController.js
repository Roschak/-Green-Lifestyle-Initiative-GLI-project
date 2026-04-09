// backend/controllers/eventController.js
const db = require('../config/db');
const admin = require('firebase-admin');

exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, location, wa_link, medal_name,
            registration_start, registration_end, event_start, event_end,
            thumbnail_type, thumbnail_text, thumbnail_color
        } = req.body;

        console.log('📝 Creating event with:', { title, registration_start, registration_end, event_start, event_end });

        let thumbnailUrl = null;

        if (req.file) {
            thumbnailUrl = req.file.path;
            console.log('✅ Thumbnail uploaded:', thumbnailUrl);
        }

        // Get host info from authenticated user
        const host_id = req.user.id;
        const host_role = req.user.role || 'user';

        // Validate and convert dates
        const regStart = new Date(registration_start);
        const regEnd = new Date(registration_end);
        const evStart = new Date(event_start);
        const evEnd = new Date(event_end);

        if (isNaN(regStart) || isNaN(regEnd) || isNaN(evStart) || isNaN(evEnd)) {
            return res.status(400).json({ success: false, message: 'Format tanggal tidak valid' });
        }

        const docRef = await db.collection('events').add({
            title: title || '',
            description: description || '',
            location: location || '',
            wa_link: wa_link || '',
            medal_name: medal_name || 'Medali Sosialisasi',
            thumbnail: thumbnailUrl,
            thumbnail_type: thumbnail_type || 'image',
            thumbnail_text: thumbnail_text || '',
            thumbnail_color: thumbnail_color || '#22c55e',
            host_id: host_id,
            host_role: host_role, // admin atau user
            status: 'roundown',
            registration_start: regStart,
            registration_end: regEnd,
            event_start: evStart,
            event_end: evEnd,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Event created:', docRef.id, '- by', host_role);

        return res.status(201).json({
            success: true,
            message: 'Event berhasil dibuat!',
            eventId: docRef.id
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

exports.registerToEvent = async (req, res) => {
    try {
        const { event_id, user_id, name, email, phone, is_gli_member } = req.body;

        const existing = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        const docRef = await db.collection('event_registrations').add({
            event_id: event_id || '',
            user_id: user_id || '',
            name: name || '',
            email: email || '',
            phone: phone || '',
            is_gli_member: is_gli_member ? 1 : 0,
            proof_img: null,
            proof_status: 'pending',
            medal_awarded: false,
            registered_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Registration created:', docRef.id);

        return res.status(201).json({
            success: true,
            message: 'Berhasil mendaftar event!',
            registrationId: docRef.id
        });

    } catch (err) {
        console.error('❌ Register Event Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.uploadProof = async (req, res) => {
    try {
        const { registration_id } = req.body;
        let proofUrl = null;

        if (req.file) {
            proofUrl = req.file.path;
            console.log('✅ Proof uploaded:', proofUrl);
        } else {
            return res.status(400).json({ success: false, message: 'Gambar wajib diupload' });
        }

        await db.collection('event_registrations').doc(registration_id).update({
            proof_img: proofUrl,
            proof_status: 'pending'
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

exports.getEventRegistrations = async (req, res) => {
    try {
        const { event_id } = req.params;

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
            const status = data.status || 'roundown';
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
                    const status = eventWithId.status || 'roundown';
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
        snap.forEach(doc => {
            const data = doc.data();
            // Convert timestamps
            if (data.registered_at?.toDate) data.registered_at = data.registered_at.toDate().toISOString();
            registrations.push({ id: doc.id, ...data });
        });

        return res.json(registrations);
    } catch (err) {
        console.error('❌ Get User Registrations Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};