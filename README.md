🌿 Green Lifestyle Initiative (GLI)
Platform Monitoring & Gamifikasi Aksi Lingkungan Real-Time
Project ID: CC26-PS030 | Lead: Ragah Dirotama W.
________________________________________
📖 Deskripsi Proyek
Green Lifestyle Initiative (GLI) adalah platform Full-Stack Web Application yang dirancang untuk mentransformasi kesadaran lingkungan menjadi aksi nyata. Masalah utama yang kami selesaikan adalah kurangnya validasi dan rendahnya motivasi dalam aktivitas ramah lingkungan.
Dengan GLI, setiap aksi (seperti mengurangi plastik atau hemat energi) harus disertai bukti foto yang kemudian diverifikasi secara manual oleh Admin melalui dashboard moderasi sebelum poin diberikan ke pengguna.
________________________________________
🚀 Fitur Unggulan
👤 User Side
•	Smart Dashboard: Visualisasi progres poin dan status aksi terbaru.
•	Action Submission: Form pelaporan aksi dengan integrasi unggah foto bukti.
•	Monthly Leaderboard: Peringkat kompetitif berdasarkan akumulasi poin bulanan.
•	Real-time Notification: Mengetahui status aksi (Approved/Rejected) secara instan.
🛡️ Admin Side (The Control Center)
•	Live Traffic Monitoring: Grafik Candle Activity untuk memantau trafik platform harian.
•	Centralized Moderation: Sistem one-click verification untuk memproses bukti aksi.
•	User Management: Memantau status login (Online/Offline) dan total kontribusi user.
•	Dynamic Point System: Kemampuan memberikan poin yang berbeda-beda sesuai kualitas aksi.
________________________________________
🛠️ Arsitektur Teknologi (Tech Stack)
Layer	Teknologi	Deskripsi
Frontend	React.js (Vite)	Library UI berbasis komponen yang cepat dan reaktif.
Styling	Tailwind CSS	Framework CSS utility-first untuk desain modern.
Icons	Lucide React	Library icon vektor yang bersih dan konsisten.
Backend	Node.js & Express.js	Server-side environment yang scalable.
Database	MySQL	Sistem manajemen database relasional (RDBMS).
Auth	JSON Web Token (JWT)	Sistem keamanan autentikasi berbasis token.
API Client	Axios	Menangani request HTTP ke backend secara asinkron.
________________________________________
📂 Struktur Folder Proyek (Full Tree)
Plaintext
/
├── backend/
│   ├── config/             # Konfigurasi database MySQL
│   ├── controllers/        # Logika utama (authController.js, adminController.js)
│   ├── middleware/         # Verifikasi Token JWT & Role Admin
│   ├── routes/             # Endpoint API (authRoutes.js, adminRoutes.js)
│   ├── uploads/            # Direktori penyimpanan bukti foto aksi user
│   ├── .env                # Variabel lingkungan (DB_USER, JWT_SECRET, dll)
│   └── index.js            # Entry point & inisialisasi Express
├── frontend/
│   ├── public/             # Asset statis
│   ├── src/
│   │   ├── components/     # UI Reusable (Sidebar, Modal, Table)
│   │   ├── context/        # AuthContext untuk manajemen login session
│   │   ├── pages/
│   │   │   ├── admin/      # AdminMonitoring, AdminModerasi
│   │   │   └── user/       # UserDashboard, UserAksi, Leaderboard
│   │   ├── services/       # Integrasi Axios (api.js)
│   │   ├── App.jsx         # Pengaturan Routing (React Router)
│   │   └── main.jsx        # Entry point React
└── database/
    └── gli_project_web.sql # Skema database lengkap
________________________________________
🗄️ Skema Database & Relasi
1. Tabel users
Field	Type	Deskripsi
id	INT (PK)	Auto increment ID.
username	VARCHAR	Nama unik pengguna.
points	INT	Akumulasi total poin.
monthly_points	INT	Poin untuk filter leaderboard bulan berjalan.
is_online	BOOLEAN	Status keberadaan user di platform.

2. Tabel actions
Field	Type	Deskripsi
id	INT (PK)	ID unik aksi.
user_id	INT (FK)	Berelasi ke users.id.
status	ENUM	'pending', 'approved', 'rejected'.
image_url	TEXT	Path/lokasi file foto di server.
points	INT	Nominal poin yang diajukan/diberikan.
________________________________________
🛰️ API Endpoints (Dokumentasi Singkat)
Authentication
•	POST /api/auth/register - Mendaftarkan user baru.
•	POST /api/auth/login - Mendapatkan token akses.
Admin Actions
•	GET /api/admin/actions - Mengambil semua data aksi (filter status).
•	PUT /api/admin/verify/:id - Menyetujui aksi & menambah poin ke user secara otomatis.
•	GET /api/admin/stats - Mengambil data statistik untuk grafik dashboard.
________________________________________
⚙️ Panduan Instalasi (Replikasi)
1.	Clone Repository:
Bash
git clone https://github.com/ragah-dirotama/gli-project.git

2.	Setup Database:
Impor gli_project_web.sql ke MySQL Anda (Laragon/XAMPP).

3.	Backend Setup:
Bash
cd backend
npm install
npm start

4.	Frontend Setup:
Bash
cd frontend
npm install
npm run dev
________________________________________
👥 Tim Pengembang (CC26-PS030)
•	Ragah Dirotama W. - Project Manager 
•	Nabila - Frontend 
•	Hayfa - Backend 
•	Talita - UI/UX Designer 
•	Tiwi - Data Analyst 

README.md ini ditulis oleh tim CC26-PS030 UNTUK MEMPRJELAS repo yang kita buat 