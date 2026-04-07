// controllers/eventController.js
const db = require('../config/db');

// ── Helper: auto update status event berdasarkan waktu ──────────────────────
const autoUpdateStatus = async () => {
    const now  = new Date();
    const snap = await db.collection('events').get();
    const batch = db.batch();
    let changed = false;

    snap.docs.forEach(doc => {
        const e = doc.data();
        const regEnd   = e.registration_end?.toDate?.() || new Date(e.registration_end);
        const eventEnd = e.event_end?.toDate?.()        || new Date(e.event_end);

        if (e.status === 'roundown' && now > regEnd) {
            batch.update(doc.ref, { status: 'dilaksanakan' });
            changed = true;
        } else if (e.status === 'dilaksanakan' && now > eventEnd) {
            batch.update(doc.ref, { status: 'berakhir' });
            changed = true;
        }
    });

    if (changed) await batch.commit();
};

// ── Helper: serialise Firestore Timestamp ke string ISO ─────────────────────
const serializeEvent = (id, data) => {
    const toISO = (v) => v?.toDate ? v.toDate().toISOString() : v;
    return {
        id,
        ...data,
        registration_start: toISO(data.registration_start),
        registration_end:   toISO(data.registration_end),
        event_start:        toISO(data.event_start),
        event_end:          toISO(data.event_end),
        created_at:         toISO(data.created_at),
    };
};

// ================= GET ALL EVENTS (PUBLIC) =================
exports.getAllEvents = async (req, res) => {
    try {
        await autoUpdateStatus();

        const snap   = await db.collection('events').orderBy('created_at', 'desc').get();
        const events = await Promise.all(snap.docs.map(async doc => {
            const event = serializeEvent(doc.id, doc.data());

            // Host name
            const hostDoc = await db.collection('users').doc(event.host_id).get();
            event.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';

            // Count registrations
            const regSnap = await db.collection('event_registrations')
                .where('event_id', '==', doc.id).get();
            event.total_registered = regSnap.size;
            event.total_hadir      = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;

            return event;
        }));

        return res.json(events);
    } catch (err) {
        console.error('❌ ERROR GET EVENTS:', err);
        return res.status(500).json({ message: 'Gagal ambil data event' });
    }
};

// ================= GET SINGLE EVENT =================
exports.getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await db.collection('events').doc(id).get();
        if (!doc.exists) return res.status(404).json({ message: 'Event tidak ditemukan' });

        const event   = serializeEvent(doc.id, doc.data());
        const hostDoc = await db.collection('users').doc(event.host_id).get();
        event.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';

        const regSnap = await db.collection('event_registrations')
            .where('event_id', '==', id).get();
        event.total_registered = regSnap.size;
        event.total_hadir      = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;

        return res.json(event);
    } catch (err) {
        console.error('❌ ERROR GET EVENT:', err);
        return res.status(500).json({ message: 'Gagal ambil event' });
    }
};

// ================= CREATE EVENT =================
exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, wa_link,
            thumbnail_type, thumbnail_text, thumbnail_color,
            host_id, host_role,
            registration_start, registration_end,
            event_start, event_end, location, medal_name
        } = req.body;

        let thumbnail = null;
        if (req.file) thumbnail = `/uploads/${req.file.filename}`;

        await db.collection('events').add({
            title,
            description:        description    || '',
            thumbnail,
            thumbnail_type:     thumbnail_type || 'image',
            thumbnail_text:     thumbnail_text || title,
            thumbnail_color:    thumbnail_color || '#22c55e',
            wa_link:            wa_link         || '',
            host_id,
            host_role,
            status:             'roundown',
            registration_start: new Date(registration_start),
            registration_end:   new Date(registration_end),
            event_start:        new Date(event_start),
            event_end:          new Date(event_end),
            location:           location        || '',
            medal_name:         medal_name      || 'Medali Sosialisasi',
            created_at:         new Date()
        });

        return res.status(201).json({ success: true, message: 'Event berhasil dibuat' });
    } catch (err) {
        console.error('❌ ERROR CREATE EVENT:', err);
        return res.status(500).json({ message: 'Gagal membuat event' });
    }
};

// ================= REGISTER EVENT =================
exports.registerEvent = async (req, res) => {
    try {
        const { event_id, name, email, phone } = req.body;
        let { user_id, is_gli_member } = req.body;

        // Auto-link: cek apakah email terdaftar di GLI
        const userSnap = await db.collection('users')
            .where('email', '==', email)
            .where('role',  '==', 'user')
            .limit(1).get();

        if (!userSnap.empty) {
            user_id       = userSnap.docs[0].id;
            is_gli_member = 1;
        } else {
            user_id       = user_id || null;
            is_gli_member = is_gli_member ? 1 : 0;
        }

        // Cek event
        const eventDoc = await db.collection('events').doc(event_id).get();
        if (!eventDoc.exists) return res.status(404).json({ message: 'Event tidak ditemukan' });
        const event = eventDoc.data();
        if (event.status !== 'roundown') return res.status(400).json({ message: 'Pendaftaran sudah ditutup' });

        // Cek sudah daftar
        const existSnap = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .where('email',    '==', email)
            .limit(1).get();
        if (!existSnap.empty) return res.status(400).json({ message: 'Email sudah terdaftar di event ini' });

        const docRef = await db.collection('event_registrations').add({
            event_id,
            user_id,
            name,
            email,
            phone:         phone || null,
            is_gli_member,
            proof_img:     null,
            proof_status:  'pending',
            medal_awarded: 0,
            registered_at: new Date()
        });

        return res.status(201).json({
            success:         true,
            message:         'Berhasil mendaftar!',
            registration_id: docRef.id,
            is_gli_member,
            wa_link:         event.wa_link   || null,
            event_title:     event.title,
            event_status:    event.status,
            medal_name:      event.medal_name,
        });
    } catch (err) {
        console.error('❌ ERROR REGISTER EVENT:', err);
        return res.status(500).json({ message: 'Gagal mendaftar event' });
    }
};

// ================= UPLOAD BUKTI FOTO =================
exports.uploadProof = async (req, res) => {
    try {
        const { registration_id } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Foto wajib diupload' });

        const imgUrl = `/uploads/${req.file.filename}`;
        await db.collection('event_registrations').doc(registration_id).update({
            proof_img:    imgUrl,
            proof_status: 'pending'
        });

        return res.json({ success: true, message: 'Bukti foto berhasil diupload' });
    } catch (err) {
        console.error('❌ ERROR UPLOAD PROOF:', err);
        return res.status(500).json({ message: 'Gagal upload bukti' });
    }
};

// ================= VERIFY PROOF (HOST) =================
exports.verifyProof = async (req, res) => {
    const { registration_id, status } = req.body;
    try {
        const regRef = db.collection('event_registrations').doc(registration_id);
        const regDoc = await regRef.get();
        if (!regDoc.exists) return res.status(404).json({ message: 'Data tidak ditemukan' });
        const reg = regDoc.data();

        await regRef.update({ proof_status: status });

        // Kalau approved dan member GLI → kasih medali
        if (status === 'approved' && reg.is_gli_member && reg.user_id) {
            const eventDoc = await db.collection('events').doc(reg.event_id).get();
            const medalName = eventDoc.exists ? (eventDoc.data().medal_name || 'Medali Sosialisasi') : 'Medali Sosialisasi';

            const userRef = db.collection('users').doc(reg.user_id);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const existing = userDoc.data().medal || '';
                const arr      = existing ? existing.split(',').map(m => m.trim()) : [];
                if (!arr.includes(medalName)) {
                    arr.push(medalName);
                    await userRef.update({ medal: arr.join(', ') });
                }
            }
            await regRef.update({ medal_awarded: 1 });
        }

        return res.json({ success: true, message: 'Verifikasi berhasil' });
    } catch (err) {
        console.error('❌ ERROR VERIFY PROOF:', err);
        return res.status(500).json({ message: 'Gagal verifikasi' });
    }
};

// ================= GET REGISTRATIONS (HOST) =================
exports.getEventRegistrations = async (req, res) => {
    const { id } = req.params;
    try {
        const snap = await db.collection('event_registrations')
            .where('event_id', '==', id)
            .orderBy('registered_at', 'desc')
            .get();

        const regs = await Promise.all(snap.docs.map(async doc => {
            const reg = { id: doc.id, ...doc.data() };
            if (reg.user_id) {
                const userDoc = await db.collection('users').doc(reg.user_id).get();
                reg.gli_name = userDoc.exists ? userDoc.data().name : null;
            }
            return reg;
        }));

        return res.json(regs);
    } catch (err) {
        console.error('❌ ERROR GET REGISTRATIONS:', err);
        return res.status(500).json({ message: 'Gagal ambil data pendaftaran' });
    }
};

// ================= GET MY EVENTS (HOST) =================
exports.getMyEvents = async (req, res) => {
    const { host_id } = req.params;
    try {
        await autoUpdateStatus();

        const snap   = await db.collection('events')
            .where('host_id', '==', host_id)
            .orderBy('created_at', 'desc')
            .get();

        const events = await Promise.all(snap.docs.map(async doc => {
            const event   = serializeEvent(doc.id, doc.data());
            const regSnap = await db.collection('event_registrations').where('event_id', '==', doc.id).get();
            event.total_registered = regSnap.size;
            event.total_hadir      = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;
            return event;
        }));

        return res.json(events);
    } catch (err) {
        console.error('❌ ERROR GET MY EVENTS:', err);
        return res.status(500).json({ message: 'Gagal ambil event saya' });
    }
};

// ================= GET MY REGISTRATIONS =================
exports.getMyRegistrations = async (req, res) => {
    const { user_id } = req.params;
    try {
        await autoUpdateStatus();

        const snap = await db.collection('event_registrations')
            .where('user_id', '==', user_id)
            .orderBy('registered_at', 'desc')
            .get();

        const regs = await Promise.all(snap.docs.map(async doc => {
            const reg     = { id: doc.id, ...doc.data() };
            const eventDoc = await db.collection('events').doc(reg.event_id).get();
            if (eventDoc.exists) {
                const e = serializeEvent(eventDoc.id, eventDoc.data());
                reg.title             = e.title;
                reg.event_status      = e.status;
                reg.event_start       = e.event_start;
                reg.event_end         = e.event_end;
                reg.location          = e.location;
                reg.wa_link           = e.wa_link;
                reg.thumbnail         = e.thumbnail;
                reg.thumbnail_type    = e.thumbnail_type;
                reg.thumbnail_text    = e.thumbnail_text;
                reg.thumbnail_color   = e.thumbnail_color;
                reg.medal_name        = e.medal_name;
                reg.description       = e.description;
                reg.registration_end  = e.registration_end;
                reg.host_role         = e.host_role;

                const hostDoc = await db.collection('users').doc(e.host_id).get();
                reg.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';
            }
            return reg;
        }));

        return res.json(regs);
    } catch (err) {
        console.error('❌ ERROR GET MY REGISTRATIONS:', err);
        return res.status(500).json({ message: 'Gagal ambil registrasi saya' });
    }
};

// ================= CHECK REGISTRATION =================
exports.checkRegistration = async (req, res) => {
    const { event_id, user_id } = req.params;
    try {
        const snap = await db.collection('event_registrations')
            .where('event_id', '==', event_id)
            .where('user_id',  '==', user_id)
            .limit(1).get();

        if (!snap.empty) {
            return res.json({ registered: true, registration: { id: snap.docs[0].id, ...snap.docs[0].data() } });
        }
        return res.json({ registered: false });
    } catch (err) {
        console.error('❌ ERROR CHECK REG:', err);
        return res.status(500).json({ message: 'Gagal cek registrasi' });
    }
};