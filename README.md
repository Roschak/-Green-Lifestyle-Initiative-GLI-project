🌿 Green Lifestyle Initiative (GLI)
Platform Monitoring & Gamifikasi Aksi Lingkungan Real-Time
Project ID: CC26-PS030 | Lead: Ragah Dirotama W.
________________________________________
📖 Deskripsi Proyek
Green Lifestyle Initiative (GLI) adalah platform Full-Stack Web Application yang dirancang untuk mentransformasi kesadaran lingkungan menjadi aksi nyata. Masalah utama yang kami selesaikan adalah kurangnya validasi dan rendahnya motivasi dalam aktivitas ramah lingkungan.
Dengan GLI, setiap aksi (seperti mengurangi plastik atau hemat energi) harus disertai bukti foto yang kemudian diverifikasi secara manual oleh Admin melalui dashboard moderasi sebelum poin diberikan ke pengguna. Platform juga menyediakan event management system, leaderboard real-time, medal gamification, dan mentoring system untuk mendorong partisipasi berkelanjutan.
________________________________________
🚀 Fitur Unggulan
👤 User Side
**Dashboard & Profil**
•	Smart Dashboard: Visualisasi progres poin, level, dan aksi terbaru.
•	Profile Management: Edit nama, upload foto profil
•	Medal Collection: Kumpulkan badge pencapaian dari aksi
•	Level System: Eco-Newbie → Eco-Warrior → Eco-Champion

**Action Management**
•	Action Submission: Form pelaporan aksi dengan integrasi unggah foto bukti.
•	Riwayat Aksi: Tracking status aksi (Pending/Approved/Rejected)
•	Real-time Notification: Mengetahui status aksi (Approved/Rejected) secara instan.

**Leaderboard & Kompetisi**
•	Monthly Leaderboard: Peringkat berdasarkan poin bulanan
•	User Ranking: Melihat posisi di antara pengguna lain
•	Hanya user dengan poin > 0 yang tampil di ranking

**Event Management** ✨ NEW
•	Event Discovery: Daftar event ramah lingkungan yang tersedia
•	Event Registration: Mendaftar mengikuti event
•	Event Attendance Tracking: Upload bukti kehadiran dengan foto
•	Auto Medal Award: Medali otomatis saat menyelesaikan event
•	Event Leaderboard: Ranking peserta per event

**Mentoring System** ✨ NEW
•	Online Mentors: Daftar mentor yang sedang aktif online
•	Real-time Chat: Hubungi mentor untuk diskusi langsung
•	Auto Offline Detection: Status mentor berubah offline jika idle >5 menit
•	Chat History: Riwayat percakapan tersimpan

🛡️ Admin Side (The Control Center)
**Monitoring & Analytics**
•	Live Traffic Monitoring: Grafik aktivitas real-time per hari/minggu
•	Top Performers: Menampilkan pengguna dengan kontribusi tertinggi
•	User Activity Graph: Visualisasi tren aktivitas platform
•	Period Filtering: Filter data by tanggal, bulan, tahun

**User Management**
•	User List: Monitoring semua pengguna dengan status (online/offline)
•	User Detail: Lihat riwayat aksi, poin, medal per user
•	Duplicate Account Detection: Identifikasi akun duplikat
•	User Verification: Kelola status login dan aktivitas

**Action Moderation**
•	Pending Actions Queue: Daftar aksi menunggu verifikasi
•	Photo Review: Lihat bukti foto ukuran besar
•	One-Click Verification: Setujui atau tolak dengan catatan
•	Dynamic Points: Tentukan poin berdasarkan kualitas aksi
•	Medal Auto-Award: Medali otomatis diberikan saat approval
•	Rejection Reason: Catat alasan penolakan untuk feedback

**Event Management** ✨ NEW
•	Create Event: Buat event baru dengan detail lengkap
•	Event Dashboard: Kelola semua event yang berjalan
•	Attendance Tracking: Monitor peserta dan bukti kehadiran
•	Medal Configuration: Atur medali untuk event
•	Event Leaderboard: Lihat ranking peserta per event
•	Registration Management: Terima/tolak registrasi peserta
________________________________________
🛠️ Arsitektur Teknologi (Tech Stack)
| Layer | Teknologi | Deskripsi |
|-------|-----------|-----------|
| Frontend | React.js (Vite) | Library UI berbasis komponen yang cepat dan reaktif |
| Frontend State | Context API | Manajemen state aplikasi global |
| Styling | Tailwind CSS | Framework CSS utility-first untuk desain modern |
| Icons | Lucide React | Library icon vektor yang bersih dan konsisten |
| Backend | Node.js & Express.js | Server-side environment yang scalable |
| Database | Firestore (Cloud) | NoSQL cloud database real-time |
| Authentication | Firebase Auth | SSO, Email/Password, Google Sign-in |
| Storage | Cloudinary | Cloud storage untuk foto/media |
| API Client | Axios | Menangani request HTTP ke backend secara asinkron |
| Deployment | Vercel (Backend) | Server-side hosting & API |
| Deployment | Firebase Hosting | Frontend static hosting |
________________________________________
📂 Struktur Folder Proyek (Full Tree)

```
GLI-Project-Web/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Firestore configuration
│   │   └── multer.js             # File upload (Cloudinary)
│   ├── controllers/
│   │   ├── authController.js     # Login, Register, OAuth
│   │   ├── userController.js     # Profile, actions, leaderboard
│   │   ├── adminController.js    # Dashboard, verification, stats
│   │   └── eventController.js    # Event management ✨ NEW
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification & role checking
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/* endpoints
│   │   ├── userRoutes.js         # /api/user/* endpoints
│   │   ├── adminRoutes.js        # /api/admin/* endpoints
│   │   └── eventRoutes.js        # /api/events/* endpoints ✨ NEW
│   ├── .env                      # Environment variables
│   ├── .env.example              # Template untuk .env
│   ├── serviceAccountKey.json    # Firebase service account
│   ├── server.js                 # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── user/
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── UserAksi.jsx
│   │   │   │   ├── UserRiwayat.jsx
│   │   │   │   ├── UserPeringkat.jsx
│   │   │   │   ├── UserEvent.jsx              # ✨ NEW
│   │   │   │   ├── UserProfil.jsx
│   │   │   │   └── UserMentoring.jsx          # ✨ NEW
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminMonitoring.jsx
│   │   │       ├── AdminModerasi.jsx
│   │   │       ├── AdminEvent.jsx             # ✨ NEW
│   │   │       ├── AdminAttendance.jsx        # ✨ NEW
│   │   │       └── AdminProfil.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── firebase_config.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local
│   ├── vite.config.js
│   └── package.json
│
├── README.md                     # Documentation
├── USER_GUIDE.md                 # User guide ✨ NEW
└── package.json
```
________________________________________
🗄️ Skema Database & Relasi

### Collection: `users`
- id, name, email, avatar, role
- points, monthly_points, level
- medal (comma-separated string)
- status (online/offline), last_activity
- created_at, updated_at

### Collection: `actions`
- id, user_id, action_name, description
- photo_url, created_at
- status (pending/approved/rejected)
- points_earned, admin_note, rejection_reason
- updated_at

### Collection: `events` ✨ NEW
- id, title, description, location
- medal_name, host_id, host_role
- thumbnail, thumbnail_type, thumbnail_text, thumbnail_color
- registration_start, registration_end
- event_start, event_end
- status (upcoming/ongoing/ended)
- wa_link, created_at

### Collection: `event_registrations` ✨ NEW
- id, event_id, user_id
- status (registered/attended/absent)
- medal_awarded (boolean)
- proof_url, registered_at, attended_at

### Collection: `mentor_sessions` ✨ NEW
- id, mentor_id, user_id
- status (active/ended)
- created_at, ended_at
________________________________________
🛰️ API Endpoints (Dokumentasi)

### Authentication (`/api/auth/*`)
- POST /auth/register
- POST /auth/login
- POST /auth/google-login
- POST /auth/logout

### User (`/api/user/*`)
- GET /user/profile/:id
- PUT /user/profile/:id
- POST /user/profile/:id/avatar
- GET /user/stats/:id
- POST /user/actions
- GET /user/actions/:id
- GET /user/leaderboard
- POST /user/heartbeat (auto-offline detection)

### Admin (`/api/admin/*`)
- GET /admin/stats
- GET /admin/users
- GET /admin/users/:id
- GET /admin/actions
- PUT /admin/actions/:id (auto-medal award)
- GET /admin/leaderboard
- DELETE /admin/users/:id

### Events ✨ NEW (`/api/events/*`)
- GET /events
- GET /events/:id
- POST /events (admin only)
- PUT /events/:id (admin only)
- DELETE /events/:id (admin only)
- POST /events/:id/register
- GET /events/:id/registrations
- POST /events/:id/proof
- GET /events/:id/leaderboard
________________________________________
⚙️ Panduan Instalasi

### Prerequisite
- Node.js v16+
- Firebase account
- Cloudinary account
- Git

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env dengan Firebase & Cloudinary credentials
npm install
npm start
# Berjalan di http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local dengan API URL
npm install
npm run dev
# Berjalan di http://localhost:5173
```

---

## 📊 Dashboard Features

### User Dashboard
- 📈 Poin progression
- 🏆 Current level & medals
- ⏳ Pending actions status
- 🎖️ Medal collection

### Admin Dashboard
- 📊 Real-time traffic (7-day graph)
- 👥 Top 5 performers
- ⏳ Recent pending actions
- 📈 Action approval rate
- 🎪 Event management

---

## 🔐 Keamanan

- ✅ Semua API key di .env (tidak di code)
- ✅ Firestore rules restrict unauthorized access
- ✅ Users hanya bisa modify profil sendiri
- ✅ Admin role verified server-side
- ✅ Photo URLs signed untuk security

---

## 🚀 Deployment

### Backend (Vercel)
```bash
cd backend && vercel deploy --prod
```

### Frontend (Firebase Hosting)
```bash
cd frontend && npm run build && firebase deploy
```
________________________________________
👥 Tim Pengembang (CC26-PS030)

| Role | Name |
|------|------|
| 🎯 Project Manager | Ragah Dirotama W. |
| 🎨 Frontend Developer | Nabila |
| 💻 Backend Developer | Hayfa |
| 🖌️ UI/UX Designer | Talita |
| 📊 Data Analyst | Tiwi |

---

## 📞 Support

- **Documentation:** Lihat USER_GUIDE.md
- **Issues:** GitHub Issues
- **Email:** support@gli-project.com

---

**Mari bersama ciptakan gaya hidup hijau yang berkelanjutan! 🌱**

*Last Updated: April 2026 | v1.0.0*