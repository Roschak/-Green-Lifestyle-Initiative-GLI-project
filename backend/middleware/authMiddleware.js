// backend/middleware/authMiddleware.js
const admin = require('firebase-admin');
const db = require('../config/db');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No token provided');
            return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
        }

        const token = authHeader.split(' ')[1];
        console.log('🔍 Verifying Firebase token, length:', token.length);

        // ✅ Verify Firebase token using Admin SDK
        const decoded = await admin.auth().verifyIdToken(token);
        console.log('✅ Firebase token verified, user ID:', decoded.uid);
        console.log('✅ Token email:', decoded.email);
        console.log('✅ Token issued at:', new Date(decoded.iat * 1000));
        console.log('✅ Token expires at:', new Date(decoded.exp * 1000));

        const userDoc = await db.collection('users').doc(decoded.uid).get();

        if (!userDoc.exists) {
            console.log('❌ User not found in Firestore');
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const userData = userDoc.data();

        req.user = {
            id: decoded.uid,
            role: userData.role || 'user',
            email: userData.email,
            name: userData.name
        };

        console.log('✅ Auth success:', req.user.email);
        next();

    } catch (error) {
        console.error('❌ Auth error:', error.code, '-', error.message);
        return res.status(401).json({ success: false, message: error.message || 'Token tidak valid' });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        console.log('❌ Not admin');
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses admin' });
    }
    next();
};

module.exports = { protect, adminOnly };