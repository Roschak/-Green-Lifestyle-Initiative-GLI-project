// backend/controllers/userController.js
const db = require('../config/db');
const admin = require('firebase-admin');

exports.createAction = async (req, res) => {
    try {
        const { user_id, action_name, description, location } = req.body;
        let imageUrl = null;

        if (!user_id || !action_name) {
            return res.status(400).json({ success: false, message: 'User ID dan nama aksi wajib' });
        }

        if (req.file) {
            imageUrl = req.file.path;
            console.log('✅ Image uploaded:', imageUrl);
        }

        const docRef = await db.collection('actions').add({
            user_id,
            action_name,
            description: description || '',
            location: location || '',
            img: imageUrl,
            status: 'pending',
            points_earned: 0,
            admin_note: '',
            rejection_reason: '',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Action created:', docRef.id);

        return res.status(201).json({
            success: true,
            message: 'Aksi berhasil dilaporkan!',
            actionId: docRef.id
        });

    } catch (err) {
        console.error('❌ Create Action Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserActions = async (req, res) => {
    try {
        const userId = req.params.id;

        const snapshot = await db.collection('actions')
            .where('user_id', '==', userId)
            .orderBy('created_at', 'desc')
            .get();

        const actions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
            if (data.updated_at?.toDate) data.updated_at = data.updated_at.toDate().toISOString();
            actions.push({ id: doc.id, ...data });
        });

        console.log(`✅ getUserActions for ${userId}: ${actions.length} actions`);
        return res.json(actions);

    } catch (err) {
        console.error('❌ Get User Actions Error:', err);
        // If index error, try without orderBy as fallback
        if (err.code === 9) {
            try {
                const snapshot = await db.collection('actions')
                    .where('user_id', '==', req.params.id)
                    .get();

                const actions = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Convert Firestore Timestamps to ISO strings
                    if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
                    if (data.updated_at?.toDate) data.updated_at = data.updated_at.toDate().toISOString();
                    actions.push({ id: doc.id, ...data });
                });

                // Sort in memory
                actions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                console.log(`✅ getUserActions (fallback) for ${req.params.id}: ${actions.length} actions`);
                return res.json(actions);
            } catch (fallbackErr) {
                console.error('❌ Fallback error:', fallbackErr);
                // Always return array even on error
                return res.json([]);
            }
        }
        console.error('❌ Returning fallback array');
        return res.json([]);
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const { id } = req.params;

        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const user = userDoc.data();
        const actSnap = await db.collection('actions')
            .where('user_id', '==', id)
            .get();

        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        const approved = actions.filter(a => a.status === 'approved').length;
        const pending = actions.filter(a => a.status === 'pending').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;

        return res.json({
            totalPoints: user.points || 0,
            totalActions: actions.length,
            approved,
            pending,
            rejected
        });

    } catch (err) {
        console.error('❌ Get User Stats Error:', err);
        return res.status(500).json({ message: 'Error' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const user = userDoc.data();
        const actSnap = await db.collection('actions').where('user_id', '==', id).get();
        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        const approved = actions.filter(a => a.status === 'approved').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;
        const pending = actions.filter(a => a.status === 'pending').length;

        const rankSnap = await db.collection('users')
            .where('role', '==', 'user')
            .where('monthly_points', '>', user.monthly_points || 0)
            .get();

        return res.json({
            id,
            name: user.name || '',
            email: user.email || '',
            points: user.points || 0,
            monthlyPoints: user.monthly_points || 0,
            level: user.level || 'Eco-Newbie',
            medals: user.medal ? user.medal.split(',').map(m => m.trim()) : [],
            ranking: rankSnap.size + 1,
            approved,
            rejected,
            pending
        });

    } catch (err) {
        console.error('❌ Get User Profile Error:', err);
        return res.status(500).json({ message: 'Error' });
    }
};