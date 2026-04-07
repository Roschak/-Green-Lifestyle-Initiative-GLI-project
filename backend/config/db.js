// config/db.js
const admin = require('firebase-admin')

// Inisialisasi hanya sekali
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json')
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}

const db = admin.firestore()

module.exports = db