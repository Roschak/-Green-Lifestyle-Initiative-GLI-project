// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    console.log("=== AUTH CHECK ===");

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log("TOKEN:", token);

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'secret_gli_123'
            );

            console.log("DECODED USER:", decoded);

            req.user = decoded;
            next();
        } catch (error) {
            console.error("❌ TOKEN ERROR:", error.message);
            return res.status(401).json({
                success: false,
                message: "Sesi tidak valid, silakan login ulang!"
            });
        }
    }

    if (!token) {
        console.log("❌ TOKEN TIDAK ADA");
        return res.status(401).json({
            success: false,
            message: "Akses ditolak, token tidak ditemukan!"
        });
    }
};

module.exports = { protect };