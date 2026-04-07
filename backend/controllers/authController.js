// controllers/authController.js
const db     = require('../config/db')
const bcrypt = require('bcrypt')
const jwt    = require('jsonwebtoken')
const admin  = require('firebase-admin')

// ── Helper: cari user by email ───────────────────────────────────────────────
const getUserByEmail = async (email) => {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get()
    if (snap.empty) return null
    const doc = snap.docs[0]
    return { id: doc.id, ...doc.data() }
}

// ── Helper: buat token ───────────────────────────────────────────────────────
const makeToken = (id, role) => jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
)

// ================= REGISTER =================
exports.register = async (req, res) => {
    const { name, email, password } = req.body
    try {
        const existing = await getUserByEmail(email)
        if (existing) return res.status(400).json({ message: 'Email sudah terdaftar!' })

        const hashed = await bcrypt.hash(password, 10)

        // ✅ Pakai add() agar Firestore generate ID otomatis
        const docRef = await db.collection('users').add({
            name,
            email,
            password:       hashed,
            role:           'user',
            points:         0,
            monthly_points: 0,
            level:          'Eco-Newbie',
            status:         'offline',
            medal:          '',
            last_reset:     null,
            created_at:     admin.firestore.FieldValue.serverTimestamp()
        })

        return res.status(201).json({ message: 'Registrasi Berhasil! Silakan Login.' })
    } catch (err) {
        console.error('Error Register:', err)
        return res.status(500).json({ message: 'Gagal melakukan pendaftaran' })
    }
}

// ================= LOGIN =================
exports.login = async (req, res) => {
    const { email, password } = req.body
    try {
        console.log('=== LOGIN ===', email)

        const user = await getUserByEmail(email)
        if (!user) return res.status(401).json({ message: 'Email atau password salah' })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(401).json({ message: 'Email atau password salah' })

        // Update status online
        await db.collection('users').doc(user.id).update({ status: 'online' })

        const token = makeToken(user.id, user.role)

        // Kirim user tanpa password
        const { password: _, ...safeUser } = user

        console.log('✅ LOGIN BERHASIL, role:', user.role)
        return res.json({ message: 'Login berhasil', token, user: safeUser })

    } catch (err) {
        console.error('❌ ERROR LOGIN:', err)
        return res.status(500).json({ message: 'Server error' })
    }
}

// ================= LOGOUT =================
exports.logout = async (req, res) => {
    try {
        const { userId } = req.body
        console.log('=== LOGOUT === USER ID:', userId)
        if (userId) {
            await db.collection('users').doc(userId).update({ status: 'offline' })
        }
        return res.json({ message: 'Berhasil logout' })
    } catch (err) {
        console.error('❌ ERROR LOGOUT:', err)
        return res.status(500).json({ message: 'Gagal logout' })
    }
}

// ================= GOOGLE LOGIN =================
exports.googleLogin = async (req, res) => {
    const { name, email, googleId } = req.body
    try {
        console.log('=== GOOGLE LOGIN ===', email)

        let user = await getUserByEmail(email)

        if (user) {
            await db.collection('users').doc(user.id).update({ status: 'online' })
            console.log('✅ USER LAMA LOGIN GOOGLE, role:', user.role)
        } else {
            const hashed = await bcrypt.hash(googleId + Date.now(), 10)
            const docRef = await db.collection('users').add({
                name, email,
                password:       hashed,
                role:           'user',
                points:         0,
                monthly_points: 0,
                level:          'Eco-Newbie',
                status:         'online',
                medal:          '',
                last_reset:     null,
                created_at:     admin.firestore.FieldValue.serverTimestamp()
            })
            user = {
                id: docRef.id, name, email,
                role: 'user', points: 0,
                monthly_points: 0, level: 'Eco-Newbie', status: 'online'
            }
            console.log('✅ USER BARU REGISTER VIA GOOGLE')
        }

        const token = makeToken(user.id, user.role)
        const { password: _, ...safeUser } = user

        return res.json({ message: 'Google Login berhasil', token, user: safeUser })
    } catch (err) {
        console.error('❌ ERROR GOOGLE LOGIN:', err)
        return res.status(500).json({ message: 'Gagal login dengan Google' })
    }
}

// ================= GOOGLE REGISTER =================
exports.googleRegister = async (req, res) => {
    const { name, email, googleId } = req.body
    try {
        if (!email || !googleId) return res.status(400).json({ message: 'Email dan Google ID wajib diisi!' })

        const existing = await getUserByEmail(email)
        if (existing) return res.status(400).json({ message: 'Email already exists. Please login instead.' })

        const hashed = await bcrypt.hash(googleId + Date.now() + Math.random(), 10)
        const docRef = await db.collection('users').add({
            name, email,
            password:       hashed,
            role:           'user',
            points:         0,
            monthly_points: 0,
            level:          'Eco-Newbie',
            status:         'online',
            medal:          '',
            last_reset:     null,
            created_at:     admin.firestore.FieldValue.serverTimestamp()
        })

        const user  = { id: docRef.id, name, email, role: 'user', points: 0, level: 'Eco-Newbie', status: 'online' }
        const token = makeToken(user.id, user.role)

        return res.status(201).json({ success: true, message: 'Registrasi dengan Google berhasil!', token, user })
    } catch (err) {
        console.error('❌ ERROR GOOGLE REGISTER:', err)
        return res.status(500).json({ message: 'Gagal registrasi dengan Google.' })
    }
}