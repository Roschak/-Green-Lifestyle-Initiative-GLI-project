const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ✅ INITIALIZE DATABASE DULU
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// ✅ CORS CONFIGURATION - Comprehensive
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
      'https://gli-frontend.vercel.app',
      'https://gli-project-web.web.app',
      'https://gli-project-web.firebaseapp.com'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list or is a vercel domain
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.web.app')) {
      callback(null, true);
    } else {
      console.log('❌ CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// ✅ Explicit preflight handler
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ✅ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '🚀 Backend is running' });
});

// ✅ 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`✅ Firebase initialized`);
  console.log(`✅ CORS enabled for development`);
});