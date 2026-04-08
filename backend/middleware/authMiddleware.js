// middleware/authMiddleware.js
const admin = require('firebase-admin')

const protect = async (req, res, next) => {
    console.log('=== AUTH CHECK ===')

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ TOKEN TIDAK ADA')
        return res.status(401).json({ success: false, message: 'Akses ditolak, token tidak ditemukan!' })
    }

    const token = authHeader.split(' ')[1]

    try {
        // ✅ Verifikasi Firebase ID token (bukan JWT biasa)
        const decoded = await admin.auth().verifyIdToken(token)
        console.log('✅ TOKEN VALID, uid:', decoded.uid)

        // Ambil data user dari Firestore untuk dapat role
        const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get()
        
        req.user = {
            id:   decoded.uid,
            uid:  decoded.uid,
            role: userDoc.exists ? (userDoc.data().role || 'user') : 'user',
            email: decoded.email
        }

        next()
    } catch (error) {
        console.error('❌ TOKEN ERROR:', error.message)
        return res.status(401).json({ success: false, message: 'Sesi tidak valid, silakan login ulang!' })
    }
}

module.exports = { protect }