// backend/controllers/userController.js
// Handles user-related operations: action reporting, stats retrieval, profile data
const db = require('../config/db');
const admin = require('firebase-admin');

/**
 * Create Action - Endpoint untuk user submit aksi hijau baru
 * File upload optional (foto atau gambar pendukung)
 * Set status = 'pending' menunggu admin verifikasi
 * points_earned dimulai dari 0, diisi oleh admin setelah approve
 */
exports.createAction = async (req, res) => {
    try {
        const { user_id, action_name, description, location } = req.body;
        let imageUrl = null;

        // Validasi required fields
        if (!user_id || !action_name) {
            return res.status(400).json({ success: false, message: 'User ID dan nama aksi wajib' });
        }

        // Upload file jika ada
        if (req.file) {
            imageUrl = req.file.path;
            console.log('✅ Image uploaded:', imageUrl);
        }

        // Simpan action dengan status pending untuk admin review
        const docRef = await db.collection('actions').add({
            user_id,
            action_name,
            description: description || '',
            location: location || '',
            img: imageUrl,
            status: 'pending',  // Belum approved admin
            points_earned: 0,   // Akan diisi admin
            admin_note: '',
            rejection_reason: '',  // Jika di-reject
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

/**
 * Get User Actions - Ambil riwayat aksi user (approved/pending/rejected)
 * Sort by created_at descending (terbaru duluan)
 * Convert Firestore Timestamps ke ISO string untuk JSON response
 * Fallback ke memory sort jika orderBy index error
 */
exports.getUserActions = async (req, res) => {
    try {
        const userId = req.params.id;

        // Query dengan orderBy (butuh composite index di Firestore)
        const snapshot = await db.collection('actions')
            .where('user_id', '==', userId)
            .orderBy('created_at', 'desc')
            .get();

        const actions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Firestore Timestamp object harus convert ke ISO string
            if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
            if (data.updated_at?.toDate) data.updated_at = data.updated_at.toDate().toISOString();
            actions.push({ id: doc.id, ...data });
        });

        console.log(`✅ getUserActions for ${userId}: ${actions.length} actions`);
        return res.json(actions);

    } catch (err) {
        console.error('❌ Get User Actions Error:', err);
        // Jika error composite index, fallback query tanpa orderBy
        if (err.code === 9) {
            try {
                // Query without orderBy
                const snapshot = await db.collection('actions')
                    .where('user_id', '==', req.params.id)
                    .get();

                const actions = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Convert timestamps
                    if (data.created_at?.toDate) data.created_at = data.created_at.toDate().toISOString();
                    if (data.updated_at?.toDate) data.updated_at = data.updated_at.toDate().toISOString();
                    actions.push({ id: doc.id, ...data });
                });

                // Sort in memory by created_at descending
                actions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                console.log(`✅ getUserActions (fallback) for ${req.params.id}: ${actions.length} actions`);
                return res.json(actions);
            } catch (fallbackErr) {
                console.error('❌ Fallback error:', fallbackErr);
                // Always return array even on error (graceful degradation)
                return res.json([]);
            }
        }
        console.error('❌ Returning fallback array');
        return res.json([]);
    }
};

/**
 * Get User Stats - Ambil statistik aksi user (total points, action counts, status breakdown)
 * Return format: { totalPoints, totalActions, approved, pending, rejected }
 * Digunakan untuk dashboard user
 */
exports.getUserStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Validasi user exists
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const user = userDoc.data();

        // Ambil semua aksi user
        const actSnap = await db.collection('actions')
            .where('user_id', '==', id)
            .get();

        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        // Count aksi by status
        const approved = actions.filter(a => a.status === 'approved').length;
        const pending = actions.filter(a => a.status === 'pending').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;

        return res.json({
            totalPoints: user.points || 0,  // Total poin dari semua aksi approved
            totalActions: actions.length,   // Total submission (all statuses)
            approved,   // Count aksi approved
            pending,    // Count aksi pending review
            rejected    // Count aksi rejected
        });

    } catch (err) {
        console.error('❌ Get User Stats Error:', err);
        return res.status(500).json({ message: 'Error' });
    }
};

/**
 * Get User Profile - Ambil profil lengkap user dengan ranking
 * ✅ FIXED: Ranking hanya untuk user dengan actions/points > 0
 * User tanpa aksi tidak dapat ranking (ranking = null)
 */
exports.getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user data
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const user = userDoc.data();

        // Ambil aksi user untuk stats
        const actSnap = await db.collection('actions').where('user_id', '==', id).get();
        const actions = [];
        actSnap.forEach(doc => actions.push(doc.data()));

        const approved = actions.filter(a => a.status === 'approved').length;
        const rejected = actions.filter(a => a.status === 'rejected').length;
        const pending = actions.filter(a => a.status === 'pending').length;

        // ✅ FIXED: Ranking hanya jika user punya actions atau points > 0
        let ranking = null;
        if (actions.length > 0 || (user.monthly_points || 0) > 0) {
            try {
                const rankSnap = await db.collection('users')
                    .where('role', '==', 'user')
                    .where('monthly_points', '>', user.monthly_points || 0)
                    .get();
                ranking = rankSnap.size + 1;
            } catch (indexErr) {
                // Fallback tanpa index
                const allUsersSnap = await db.collection('users')
                    .where('role', '==', 'user')
                    .get();
                let betterCount = 0;
                allUsersSnap.forEach(doc => {
                    if ((doc.data().monthly_points || 0) > (user.monthly_points || 0)) {
                        betterCount++;
                    }
                });
                ranking = betterCount + 1;
            }
        }

        return res.json({
            id,
            name: user.name || '',
            email: user.email || '',
            points: user.points || 0,
            monthlyPoints: user.monthly_points || 0,
            level: user.level || 'Eco-Newbie',
            medals: user.medal ? user.medal.split(',').map(m => m.trim()) : [],
            ranking: ranking,  // null jika tidak ada actions
            approved,
            rejected,
            pending
        });

    } catch (err) {
        console.error('❌ Get User Profile Error:', err);
        return res.status(500).json({ message: 'Error' });
    }
};

/**
 * Get Public Leaderboard - Peringkat untuk user (tidak perlu admin)
 * Top 10 users berdasarkan monthly_points
 * ✅ HANYA tampilkan users dengan points > 0 (tidak termasuk no-action users)
 * Digunakan untuk halaman Peringkat user
 */
exports.getPublicLeaderboard = async (req, res) => {
    try {
        // Fallback: Get semua users, filter, sort di memory (paling reliable)
        console.log('📌 Fetching leaderboard with points filter');
        const snap = await db.collection('users')
            .where('role', '==', 'user')
            .get();

        const users = [];
        
        // Get all user-approved action counts for total_actions field
        const actionsSnap = await db.collection('actions')
            .where('status', '==', 'approved')
            .get();
        
        const actionCounts = {};
        actionsSnap.forEach(doc => {
            const userId = doc.data().user_id;
            actionCounts[userId] = (actionCounts[userId] || 0) + 1;
        });
        
        snap.forEach(doc => {
            const points = doc.data().monthly_points || 0;
            const userId = doc.id;
            // ✅ FILTER: Hanya include users dengan points > 0
            if (points > 0) {
                users.push({
                    id: userId,
                    name: doc.data().name || 'User',
                    points: points,
                    medal: doc.data().medal || '',
                    level: doc.data().level || 'Eco-Newbie',
                    avatar: doc.data().avatar || null,
                    total_actions: actionCounts[userId] || 0
                });
            }
        });

        // Sort by points descending dan ambil top 10
        users.sort((a, b) => b.points - a.points);
        const data = users.slice(0, 10).map((u, i) => ({
            rank: i + 1,
            ...u
        }));

        return res.json({
            success: true,
            period: 'April 2026',
            data
        });

    } catch (err) {
        console.error('❌ Public Leaderboard Error:', err);
        return res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
    }
};

/**
 * Heartbeat - Update last_activity untuk tracking user aktif
 * Frontend call setiap 5 menit, update last_activity timestamp
 * Admin monitoring: Jika last_activity > 10 menit lalu, set status = offline
 */
exports.heartbeat = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User tidak teridentifikasi' });
        }

        // Update last_activity timestamp
        await db.collection('users').doc(userId).update({
            last_activity: admin.firestore.FieldValue.serverTimestamp(),
            status: 'online'  // Set ke online setiap ada heartbeat
        });

        console.log(`✅ Heartbeat from user ${userId}`);

        return res.json({
            success: true,
            message: 'Heartbeat received',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('❌ Heartbeat Error:', err);
        return res.status(500).json({ success: false, message: 'Error' });
    }
};

/**
 * Award Medal to User - Helper function untuk menambah medali ke user
 * ✅ Prevents duplicate medals
 * ✅ Records medal in user.medal field (comma-separated)
 * Used by: action approval, event completion
 */
const awardMedalToUser = async (userId, medalName) => {
    if (!userId || !medalName) {
        console.warn('⚠️ awardMedalToUser: Missing userId or medalName');
        return false;
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists()) {
            console.error('❌ User not found:', userId);
            return false;
        }

        const currentMedals = userDoc.data().medal || '';
        const medalList = currentMedals
            .split(', ')
            .filter(m => m.trim());

        // ✅ Check: medal sudah ada?
        if (medalList.includes(medalName)) {
            console.log(`⚠️ User ${userId} sudah punya medal: ${medalName}`);
            return false;
        }

        // ✅ Add medal to list
        medalList.push(medalName);
        const updatedMedals = medalList.join(', ');

        // Update Firestore
        await db.collection('users').doc(userId).update({
            medal: updatedMedals,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Medal awarded to user ${userId}: ${medalName}`);
        return true;

    } catch (err) {
        console.error('❌ awardMedalToUser error:', err);
        return false;
    }
};

/**
 * Update User Profile - Endpoint untuk edit nama, avatar
 * PUT /user/profile/{id}
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, avatar } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID diperlukan' });
        }

        const updateData = {};

        // Validate & update name
        if (name) {
            if (name.trim().length < 3) {
                return res.status(400).json({ success: false, message: 'Nama minimal 3 karakter' });
            }
            updateData.name = name.trim();
        }

        // Validate & update avatar
        if (avatar) {
            updateData.avatar = avatar; // Should be Cloudinary URL
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada field untuk diupdate' });
        }

        updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

        // Update Firestore
        await db.collection('users').doc(id).update(updateData);

        console.log(`✅ Profile updated for user ${id}:`, Object.keys(updateData));

        return res.json({
            success: true,
            message: 'Profil berhasil diupdate',
            data: updateData
        });

    } catch (err) {
        console.error('❌ Update Profile Error:', err);
        return res.status(500).json({ success: false, message: 'Gagal update profil: ' + err.message });
    }
};

/**
 * Export awardMedalToUser untuk digunakan di controller lain
 */
exports.awardMedalToUser = awardMedalToUser;

/**
 * Upload Avatar - Handle profile photo upload ke Cloudinary
 * POST /user/profile/{id}/avatar
 */
exports.uploadAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID diperlukan' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Foto profile diperlukan' });
        }

        const avatarUrl = req.file.path; // Cloudinary URL from multer

        // Update user avatar in Firestore
        await db.collection('users').doc(id).update({
            avatar: avatarUrl,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Avatar uploaded for user ${id}: ${avatarUrl}`);

        return res.json({
            success: true,
            message: 'Foto profile berhasil diupload',
            avatar: avatarUrl
        });

    } catch (err) {
        console.error('❌ Upload Avatar Error:', err);
        return res.status(500).json({ success: false, message: 'Gagal upload foto: ' + err.message });
    }
};