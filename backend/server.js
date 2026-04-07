const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes  = require('./routes/authRoutes');
const userRoutes  = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes'); // ✅ NEW

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',   authRoutes);
app.use('/api/user',   userRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/events', eventRoutes); // ✅ NEW

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend jalan di http://localhost:${PORT}`));