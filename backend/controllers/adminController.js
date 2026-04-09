// backend/controllers/adminController.js
const db = require('../config/db');
const admin = require('firebase-admin');

exports.getDashboardStats = async (req, res) => {
    try {
        const usersSnap = await db.collection('users').where('role', '==', 'user').get();
        const actSnap = await db.collection('actions').get();
        const eventSnap = await db.collection('events').get();

        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        const pending = actions.filter(a => a.status === 'pending').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;
        const approved = actions.filter(a => a.status === 'approved').length;

        return res.json({
            totalUsers: usersSnap.size,
            totalActions: actSnap.size,
            totalEvents: eventSnap.size,
            pending,
            rejected,
            approved,
            onlineUsers: usersSnap.docs.filter(d => d.data().status === 'online').length
        });

    } catch (err) {
        console.error('❌ Dashboard Stats Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const actSnap = await db.collection('actions').get();
        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        const userSnap = await db.collection('users').where('role', '==', 'user').get();
        const onlineSnap = await db.collection('users').where('status', '==', 'online').get();

        return res.json({
            totalVerified: actions.filter(a => a.status !== 'pending').length,
            approved: actions.filter(a => a.status === 'approved').length,
            rejected: actions.filter(a => a.status === 'rejected').length,
            pending: actions.filter(a => a.status === 'pending').length,
            totalUsers: userSnap.size,
            onlineUsers: onlineSnap.size
        });

    } catch (err) {
        console.error('❌ Admin Stats Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const snap = await db.collection('users').where('role', '==', 'user').get();
        const users = [];

        snap.forEach(doc => {
            const data = doc.data();
            users.push({
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                level: data.level || 'Eco-Newbie',
                medal: data.medal || '',
                points: data.points || 0,
                monthly_points: data.monthly_points || 0,
                status: data.status || 'offline'
            });
        });

        users.sort((a, b) => (b.monthly_points || 0) - (a.monthly_points || 0));

        return res.json(users);

    } catch (err) {
        console.error('❌ Get Users Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
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
            monthly_points: user.monthly_points || 0,
            level: user.level || 'Eco-Newbie',
            medal: user.medal || '',
            ranking: rankSnap.size + 1,
            total_actions: actions.length,
            approved,
            rejected,
            pending
        });

    } catch (err) {
        console.error('❌ Get User Detail Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getAllActions = async (req, res) => {
    try {
        const snap = await db.collection('actions').orderBy('created_at', 'desc').get();
        const actions = [];

        for (const doc of snap.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.user_id).get();
            actions.push({
                id: doc.id,
                user_name: userDoc.exists ? userDoc.data().name : 'Unknown',
                ...data
            });
        }

        console.log(`✅ getAllActions: ${actions.length} actions found`);
        return res.json(actions);

    } catch (err) {
        console.error('❌ Get All Actions Error:', err);
        // Always return an array, even on error
        return res.json([]);
    }
};

exports.verifyAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, points_earned, admin_note, rejection_reason } = req.body;

        const actionRef = db.collection('actions').doc(id);
        const actionDoc = await actionRef.get();

        if (!actionDoc.exists) {
            return res.status(404).json({ success: false, message: 'Action tidak ditemukan' });
        }

        const actionData = actionDoc.data();
        const updateData = {
            status,
            admin_note: admin_note || '',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        if (status === 'approved' && points_earned) {
            updateData.points_earned = Number(points_earned);

            const userRef = db.collection('users').doc(actionData.user_id);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                await userRef.update({
                    points: (userData.points || 0) + Number(points_earned),
                    monthly_points: (userData.monthly_points || 0) + Number(points_earned)
                });
            }
        }

        if (status === 'rejected' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }

        await actionRef.update(updateData);

        console.log('✅ Action verified:', id, status);

        return res.json({
            success: true,
            message: `Aksi berhasil di${status === 'approved' ? 'setujui' : 'tolak'}`
        });

    } catch (err) {
        console.error('❌ Verify Action Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const snap = await db.collection('users')
            .where('role', '==', 'user')
            .orderBy('monthly_points', 'desc')
            .limit(10)
            .get();

        const data = [];
        snap.forEach(doc => {
            const d = doc.data();
            data.push({
                id: doc.id,
                name: d.name || '',
                points: d.monthly_points || 0,
                medal: d.medal || '',
                level: d.level || 'Eco-Newbie'
            });
        });

        return res.json({ period: 'April 2026', data });

    } catch (err) {
        console.error('❌ Leaderboard Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};