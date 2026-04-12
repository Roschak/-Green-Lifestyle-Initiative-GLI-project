// backend/config/firebaseStorage.js
// Firebase Storage uploader untuk menyimpan gambar ke Firebase Storage
const admin = require('firebase-admin');

// Lazy-load bucket to avoid errors during module initialization
let bucket = null;
const getBucket = () => {
    if (!bucket) {
        bucket = admin.storage().bucket();
    }
    return bucket;
};

/**
 * Upload file ke Firebase Storage
 * @param {Buffer} fileBuffer - File buffer dari multer memory storage
 * @param {string} fileName - Nama file yang akan disimpan
 * @param {string} folder - Folder di Firebase Storage
 * @returns {Promise<string>} - Public download URL
 */
async function uploadToFirebaseStorage(fileBuffer, fileName, folder = 'uploads') {
    try {
        console.log(`📤 Uploading ${fileName} to Firebase Storage/${folder}...`);

        const bucket = getBucket();
        const timestamp = Date.now();
        const safeName = `${timestamp}-${fileName.replace(/\s+/g, '-')}`;
        const filePath = `${folder}/${safeName}`;

        const file = bucket.file(filePath);

        // Upload file
        await file.save(fileBuffer, {
            metadata: {
                contentType: 'image/jpeg', // atau detect dari mime type
                cacheControl: 'public, max-age=31536000'
            },
            public: true
        });

        // Generate public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        console.log(`✅ File uploaded: ${publicUrl}`);

        return publicUrl;
    } catch (err) {
        console.error('❌ Firebase Storage upload error:', err.message);
        throw err;
    }
}

module.exports = { uploadToFirebaseStorage };
