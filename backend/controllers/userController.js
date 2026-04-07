// controllers/userController.js
const db = require('../config/db');

// ================= CREATE ACTION =================
exports.createAction = async (req, res) => {
    try {
        console.log('=== CREATE ACTION ===');
        const { user_id, action_name, description, location } = req.body;

        if (!user_id)      return res.status(400).json({ success: false, message: 'User tidak valid' });
        if (!action_name)  return res.status(400).json({ success: false, message: 'Nama aksi wajib diisi' });

        const imgUrl = req.file ? `/uploads/${req.file.filename}` : 'no-image.jpg';

        await db.collection('actions').add({
            user_id,
            action_name,
            description:  description || '',
            location:     location    || '',
            img:          imgUrl,
            status:       'pending',
            points:       0,
            points_earned: 0,
            admin_note:   '',
            rejection_reason: '',
            created_at:   new Date()
        });

        console.log('✅ INSERT SUCCESS');
        return res.status(201).json({ success: true, message: 'Berhasil!' });

    } catch (err) {
        console.error('❌ ERROR CREATE ACTION:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ================= GET USER ACTIONS =================
exports.getUserActions = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID tidak ditemukan' });

        const snap = await db.collection('actions')
            .where('user_id', '==', userId)
            .orderBy('created_at', 'desc')
            .get();

        const actions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(actions);

    } catch (err) {
        console.error('❌ ERROR ACTIONS:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ================= GET USER STATS =================
exports.getUserStats = async (req, res) => {
    const { id } = req.params;
    try {
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'User tidak ditemukan' });
        const user = userDoc.data();

        const snap = await db.collection('actions').where('user_id', '==', id).get();
        const actions = snap.docs.map(d => d.data());

        const approved = actions.filter(a => a.status === 'approved').length;
        const pending  = actions.filter(a => a.status === 'pending').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;

        return res.json({
            totalPoints:  user.points  || 0,
            totalActions: actions.length,
            approved,
            pending,
            rejected
        });
    } catch (err) {
        console.error('❌ ERROR STATS:', err);
        return res.status(500).json({ message: 'Gagal ambil stats user' });
    }
};

// ================= GET USER PROFILE (sidebar popup) =================
exports.getUserProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'User tidak ditemukan' });
        const user = userDoc.data();

        // Hitung aksi
        const actSnap = await db.collection('actions').where('user_id', '==', id).get();
        const actions = actSnap.docs.map(d => d.data());
        const approved = actions.filter(a => a.status === 'approved').length;
        const pending  = actions.filter(a => a.status === 'pending').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;

        // Hitung ranking (berapa user dengan monthly_points lebih tinggi + 1)
        const rankSnap = await db.collection('users')
            .where('role', '==', 'user')
            .where('monthly_points', '>', user.monthly_points || 0)
            .get();
        const ranking = rankSnap.size + 1;

        const medals = user.medal
            ? user.medal.split(',').map(m => m.trim()).filter(Boolean)
            : [];

        return res.json({
            name:          user.name,
            email:         user.email,
            points:        user.points         || 0,
            monthlyPoints: user.monthly_points || 0,
            level:         user.level          || 'Eco-Newbie',
            medals,
            ranking,
            approved,
            rejected,
            pending,
            totalActions: actions.length
        });

    } catch (err) {
        console.error('❌ ERROR USER PROFILE:', err);
        return res.status(500).json({ message: 'Gagal ambil profil user' });
    }
};