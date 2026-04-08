// backend/controllers/eventController.js
const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

// Helper auto update status event
const autoUpdateStatus = async () => {
  const now = new Date();
  const snapshot = await db.collection('events').get();
  const batch = db.batch();
  let changed = false;

  snapshot.forEach(doc => {
    const e = doc.data();
    const regEnd = e.registration_end?.toDate?.() || new Date(e.registration_end);
    const eventEnd = e.event_end?.toDate?.() || new Date(e.event_end);

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

// Helper serialize event
const serializeEvent = (id, data) => {
  const toISO = (v) => v?.toDate ? v.toDate().toISOString() : v;
  return {
    id,
    ...data,
    registration_start: toISO(data.registration_start),
    registration_end: toISO(data.registration_end),
    event_start: toISO(data.event_start),
    event_end: toISO(data.event_end),
    created_at: toISO(data.created_at),
  };
};

// ================= GET ALL EVENTS =================
exports.getAllEvents = async (req, res) => {
  try {
    await autoUpdateStatus();

    const snapshot = await db.collection('events').orderBy('created_at', 'desc').get();
    const events = [];

    for (const doc of snapshot.docs) {
      const event = serializeEvent(doc.id, doc.data());
      
      // Get host name
      const hostDoc = await db.collection('users').doc(event.host_id).get();
      event.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';
      
      // Count registrations
      const regSnap = await db.collection('event_registrations')
        .where('event_id', '==', doc.id).get();
      event.total_registered = regSnap.size;
      event.total_hadir = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;
      
      events.push(event);
    }

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
    if (!doc.exists) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }

    const event = serializeEvent(doc.id, doc.data());
    const hostDoc = await db.collection('users').doc(event.host_id).get();
    event.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';

    const regSnap = await db.collection('event_registrations')
      .where('event_id', '==', id).get();
    event.total_registered = regSnap.size;
    event.total_hadir = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;

    return res.json(event);
  } catch (err) {
    console.error('❌ ERROR GET EVENT:', err);
    return res.status(500).json({ message: 'Gagal ambil event' });
  }
};

// ================= CREATE EVENT (ADMIN) =================
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, wa_link,
      thumbnail_type, thumbnail_text, thumbnail_color,
      host_id, host_role,
      registration_start, registration_end,
      event_start, event_end, location, medal_name
    } = req.body;

    let thumbnailUrl = null;
    
    // Upload thumbnail ke Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'gli_events',
        transformation: [{ width: 400, height: 400, crop: 'limit' }]
      });
      thumbnailUrl = result.secure_url;
    }

    const eventData = {
      title,
      description: description || '',
      thumbnail: thumbnailUrl,
      thumbnail_type: thumbnail_type || 'image',
      thumbnail_text: thumbnail_text || title,
      thumbnail_color: thumbnail_color || '#22c55e',
      wa_link: wa_link || '',
      host_id,
      host_role,
      status: 'roundown',
      registration_start: new Date(registration_start),
      registration_end: new Date(registration_end),
      event_start: new Date(event_start),
      event_end: new Date(event_end),
      location: location || '',
      medal_name: medal_name || 'Medali Sosialisasi',
      created_at: new Date()
    };

    const docRef = await db.collection('events').add(eventData);
    console.log('✅ Event created:', docRef.id);

    return res.status(201).json({ 
      success: true, 
      message: 'Event berhasil dibuat',
      eventId: docRef.id 
    });
  } catch (err) {
    console.error('❌ ERROR CREATE EVENT:', err);
    return res.status(500).json({ message: 'Gagal membuat event' });
  }
};

// ================= REGISTER EVENT (USER) =================
exports.registerEvent = async (req, res) => {
  try {
    const { event_id, name, email, phone } = req.body;
    let { user_id, is_gli_member } = req.body;

    // Auto-link: cek email terdaftar di users
    const userSnap = await db.collection('users')
      .where('email', '==', email)
      .where('role', '==', 'user')
      .limit(1)
      .get();

    if (!userSnap.empty) {
      user_id = userSnap.docs[0].id;
      is_gli_member = 1;
    } else {
      user_id = user_id || null;
      is_gli_member = is_gli_member ? 1 : 0;
    }

    // Cek event exists & status
    const eventDoc = await db.collection('events').doc(event_id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }
    
    const event = eventDoc.data();
    if (event.status !== 'roundown') {
      return res.status(400).json({ message: 'Pendaftaran sudah ditutup' });
    }

    // Cek sudah daftar
    const existSnap = await db.collection('event_registrations')
      .where('event_id', '==', event_id)
      .where('email', '==', email)
      .limit(1)
      .get();
      
    if (!existSnap.empty) {
      return res.status(400).json({ message: 'Email sudah terdaftar di event ini' });
    }

    const registrationData = {
      event_id,
      user_id,
      name,
      email,
      phone: phone || null,
      is_gli_member,
      proof_img: null,
      proof_status: 'pending',
      medal_awarded: false,
      registered_at: new Date()
    };

    const docRef = await db.collection('event_registrations').add(registrationData);
    console.log('✅ Registration created:', docRef.id);

    return res.status(201).json({
      success: true,
      message: 'Berhasil mendaftar!',
      registration_id: docRef.id,
      is_gli_member,
      wa_link: event.wa_link || null,
      event_title: event.title,
      event_status: event.status,
      medal_name: event.medal_name,
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
    
    if (!req.file) {
      return res.status(400).json({ message: 'Foto wajib diupload' });
    }

    // Upload ke Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'gli_event_proofs',
      transformation: [{ width: 800, height: 600, crop: 'limit' }]
    });

    await db.collection('event_registrations').doc(registration_id).update({
      proof_img: result.secure_url,
      proof_status: 'pending'
    });

    return res.json({ success: true, message: 'Bukti foto berhasil diupload' });
  } catch (err) {
    console.error('❌ ERROR UPLOAD PROOF:', err);
    return res.status(500).json({ message: 'Gagal upload bukti' });
  }
};

// ================= VERIFY PROOF (HOST/ADMIN) =================
exports.verifyProof = async (req, res) => {
  const { registration_id, status } = req.body;
  try {
    const regRef = db.collection('event_registrations').doc(registration_id);
    const regDoc = await regRef.get();
    
    if (!regDoc.exists) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    
    const reg = regDoc.data();
    await regRef.update({ proof_status: status });

    // Jika approved dan member GLI → beri medali
    if (status === 'approved' && reg.is_gli_member && reg.user_id) {
      const eventDoc = await db.collection('events').doc(reg.event_id).get();
      const medalName = eventDoc.exists ? (eventDoc.data().medal_name || 'Medali Sosialisasi') : 'Medali Sosialisasi';

      const userRef = db.collection('users').doc(reg.user_id);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const existing = userDoc.data().medal || '';
        const arr = existing ? existing.split(',').map(m => m.trim()) : [];
        if (!arr.includes(medalName)) {
          arr.push(medalName);
          await userRef.update({ medal: arr.join(', ') });
        }
      }
      await regRef.update({ medal_awarded: true });
    }

    return res.json({ success: true, message: 'Verifikasi berhasil' });
  } catch (err) {
    console.error('❌ ERROR VERIFY PROOF:', err);
    return res.status(500).json({ message: 'Gagal verifikasi' });
  }
};

// ================= GET REGISTRATIONS (HOST/ADMIN) =================
exports.getEventRegistrations = async (req, res) => {
  const { id } = req.params;
  try {
    const snapshot = await db.collection('event_registrations')
      .where('event_id', '==', id)
      .orderBy('registered_at', 'desc')
      .get();

    const registrations = [];
    for (const doc of snapshot.docs) {
      const reg = { id: doc.id, ...doc.data() };
      if (reg.user_id) {
        const userDoc = await db.collection('users').doc(reg.user_id).get();
        reg.gli_name = userDoc.exists ? userDoc.data().name : null;
      }
      registrations.push(reg);
    }

    return res.json(registrations);
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

    const snapshot = await db.collection('events')
      .where('host_id', '==', host_id)
      .orderBy('created_at', 'desc')
      .get();

    const events = [];
    for (const doc of snapshot.docs) {
      const event = serializeEvent(doc.id, doc.data());
      const regSnap = await db.collection('event_registrations')
        .where('event_id', '==', doc.id).get();
      event.total_registered = regSnap.size;
      event.total_hadir = regSnap.docs.filter(d => d.data().proof_status === 'approved').length;
      events.push(event);
    }

    return res.json(events);
  } catch (err) {
    console.error('❌ ERROR GET MY EVENTS:', err);
    return res.status(500).json({ message: 'Gagal ambil event saya' });
  }
};

// ================= GET MY REGISTRATIONS (USER) =================
exports.getMyRegistrations = async (req, res) => {
  const { user_id } = req.params;
  try {
    await autoUpdateStatus();

    const snapshot = await db.collection('event_registrations')
      .where('user_id', '==', user_id)
      .orderBy('registered_at', 'desc')
      .get();

    const registrations = [];
    for (const doc of snapshot.docs) {
      const reg = { id: doc.id, ...doc.data() };
      const eventDoc = await db.collection('events').doc(reg.event_id).get();
      
      if (eventDoc.exists) {
        const e = serializeEvent(eventDoc.id, eventDoc.data());
        reg.title = e.title;
        reg.event_status = e.status;
        reg.event_start = e.event_start;
        reg.event_end = e.event_end;
        reg.location = e.location;
        reg.wa_link = e.wa_link;
        reg.thumbnail = e.thumbnail;
        reg.medal_name = e.medal_name;
        
        const hostDoc = await db.collection('users').doc(e.host_id).get();
        reg.host_name = hostDoc.exists ? hostDoc.data().name : 'Unknown';
      }
      registrations.push(reg);
    }

    return res.json(registrations);
  } catch (err) {
    console.error('❌ ERROR GET MY REGISTRATIONS:', err);
    return res.status(500).json({ message: 'Gagal ambil registrasi saya' });
  }
};

// ================= CHECK REGISTRATION =================
exports.checkRegistration = async (req, res) => {
  const { event_id, user_id } = req.params;
  try {
    const snapshot = await db.collection('event_registrations')
      .where('event_id', '==', event_id)
      .where('user_id', '==', user_id)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return res.json({ 
        registered: true, 
        registration: { id: doc.id, ...doc.data() } 
      });
    }
    return res.json({ registered: false });
  } catch (err) {
    console.error('❌ ERROR CHECK REG:', err);
    return res.status(500).json({ message: 'Gagal cek registrasi' });
  }
};