// backend/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const makeToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    try {
        const existing = await db.collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        // ✅ FIX #1: Create Firebase Auth user FIRST
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().createUser({
                email: email.toLowerCase().trim(),
                password: password,
                displayName: name.trim()
            });
            console.log('✅ Firebase Auth user created:', firebaseUser.uid);
        } catch (firebaseErr) {
            if (firebaseErr.code === 'auth/email-already-exists') {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar di Firebase' });
            }
            throw firebaseErr;
        }

        // ✅ FIX #4: Use Firebase UID as Firestore document ID
        const hashed = await bcrypt.hash(password, 10);

        await db.collection('users').doc(firebaseUser.uid).set({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed,
            role: 'user',
            points: 0,
            monthly_points: 0,
            level: 'Eco-Newbie',
            medal: '',
            status: 'offline',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ User registered with Firebase UID:', firebaseUser.uid);

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil! Silakan login.'
        });

    } catch (err) {
        console.error('❌ Register Error:', err.message);
        return res.status(500).json({ success: false, message: 'Gagal registrasi: ' + err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    try {
        // ✅ FIX #2: Use Firebase Auth instead of Firestore lookup
        try {
            const userRecord = await admin.auth().getUserByEmail(email.toLowerCase().trim());
            console.log('✅ Firebase Auth user found:', userRecord.uid);

            // Get user data from Firestore using Firebase UID
            const userDoc = await db.collection('users').doc(userRecord.uid).get();

            if (!userDoc.exists) {
                console.log('⚠️ Firebase user exists but no Firestore record:', userRecord.uid);
                return res.status(401).json({ success: false, message: 'Email atau password salah' });
            }

            const user = userDoc.data();

            // Update user status
            try {
                await db.collection('users').doc(userRecord.uid).update({
                    status: 'online',
                    last_seen: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (updateErr) {
                console.warn('⚠️ Warning: Could not update user status:', updateErr.message);
            }

            // ✅ FIX #2: Return Firebase custom token (not JWT)
            const customToken = await admin.auth().createCustomToken(userRecord.uid);

            const { password: _, ...safeUser } = user;

            console.log('✅ Login berhasil:', email);

            return res.json({
                success: true,
                message: 'Login berhasil',
                token: customToken,
                user: { id: userRecord.uid, ...safeUser }
            });

        } catch (firebaseErr) {
            if (firebaseErr.code === 'auth/user-not-found') {
                console.log('❌ Firebase user not found:', email);
            } else {
                console.error('❌ Firebase error:', firebaseErr.code, firebaseErr.message);
            }
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }

    } catch (err) {
        console.error('❌ Login Error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (userId) {
            await db.collection('users').doc(userId).update({
                status: 'offline',
                last_seen: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return res.json({ success: true, message: 'Logout berhasil' });

    } catch (err) {
        console.error('❌ Logout Error:', err);
        return res.status(500).json({ success: false, message: 'Gagal logout' });
    }
};

/**
 * Google Register - Registrasi user melalui Google OAuth
 * ✅ Checks email uniqueness first
 * ✅ Prevents duplicate accounts
 */
exports.googleRegister = async (req, res) => {
    const { email, name, photoURL } = req.body;

    if (!email || !name) {
        return res.status(400).json({ success: false, message: 'Email dan name wajib diisi' });
    }

    try {
        // ✅ FIX: Check if email ALREADY EXISTS (by any provider)
        const existing = await db.collection('users')
            .where('email', '==', email.toLowerCase().trim())
            .limit(1)
            .get();

        if (!existing.empty) {
            console.log('⚠️ Email sudah terdaftar:', email);
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan login dengan akun Anda.' });
        }

        // ✅ Create Firebase Auth user (provider: Google)
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().createUser({
                email: email.toLowerCase().trim(),
                displayName: name.trim(),
                photoURL: photoURL || null
            });
            console.log('✅ Firebase Auth user created (Google):', firebaseUser.uid);
        } catch (firebaseErr) {
            if (firebaseErr.code === 'auth/email-already-exists') {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar di Firebase' });
            }
            throw firebaseErr;
        }

        // ✅ Create Firestore user record
        await db.collection('users').doc(firebaseUser.uid).set({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            photoURL: photoURL || null,
            provider: 'google',
            role: 'user',
            points: 0,
            monthly_points: 0,
            level: 'Eco-Newbie',
            medal: '',
            status: 'online',
            last_activity: admin.firestore.FieldValue.serverTimestamp(),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Google user registered:', firebaseUser.uid);

        // ✅ Return custom token
        const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

        return res.status(201).json({
            success: true,
            message: 'Registrasi Google berhasil!',
            token: customToken,
            userId: firebaseUser.uid,
            user: {
                id: firebaseUser.uid,
                email: email.toLowerCase().trim(),
                name: name.trim(),
                role: 'user',
                provider: 'google'
            }
        });

    } catch (err) {
        console.error('❌ Google Register Error:', err.message);
        return res.status(500).json({ success: false, message: 'Gagal registrasi Google: ' + err.message });
    }
};