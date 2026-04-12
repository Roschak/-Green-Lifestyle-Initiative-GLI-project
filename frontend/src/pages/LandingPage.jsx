import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Calendar, MapPin, Users, X, User, Phone, Mail, CheckCircle, ExternalLink, Clock } from 'lucide-react'

const BG_IMAGE = '/images/ricefields.jpeg'

const fmt = (d) => !d ? '-' : new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtDT = (d) => !d ? '-' : new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Helper to get correct image URL
const getImageUrl = (img) => {
  if (!img || img === 'no-image.jpg') return null
  if (img.startsWith('http')) return img
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const baseUrl = apiUrl.replace('/api', '')
  return `${baseUrl}${img}`
}

const STATUS_MAP = {
  roundown: { label: 'Pendaftaran Dibuka', color: 'bg-yellow-400 text-yellow-900' },
  dilaksanakan: { label: 'Sedang Berlangsung', color: 'bg-green-400 text-green-900' },
  berakhir: { label: 'Telah Berakhir', color: 'bg-gray-400 text-gray-900' },
}

// Komponen Thumbnail reusable
const EventThumb = ({ event, className = 'w-full h-full' }) => (
  event.thumbnail_type === 'image' && event.thumbnail
    ? <img src={getImageUrl(event.thumbnail)} className={`${className} object-cover`} />
    : <div className={`${className} flex items-center justify-center`} style={{ background: event.thumbnail_color || '#22c55e' }}>
      <p className="text-white font-black text-xl text-center px-4 drop-shadow">{event.thumbnail_text || event.title}</p>
    </div>
)

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()  // ✅ Ambil user yang sedang login
  const [show, setShow] = useState([false, false, false])
  const [events, setEvents] = useState([])
  const [articles, setArticles] = useState([])
  const [registerModal, setRegisterModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  // ✅ successData menyimpan data lengkap setelah berhasil daftar
  const [successData, setSuccessData] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setTimeout(() => setShow([true, false, false]), 500)
    setTimeout(() => setShow([true, true, false]), 1200)
    setTimeout(() => setShow([true, true, true]), 1900)
    fetchEvents()
    fetchArticles()
    // ✅ Jika user sudah login, isi form otomatis
    if (user) {
      setForm(f => ({ ...f, name: user.name || '', email: user.email || '' }))
    }

    // ✅ Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [user])

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      setEvents(res.data || [])
    } catch (err) { console.error('Gagal ambil events:', err) }
  }

  const fetchArticles = async () => {
    try {
      const res = await api.get('/articles')
      setArticles(res.data.articles || [])
    } catch (err) { console.error('Gagal ambil articles:', err) }
  }

  const handleOpenRegister = (event) => {
    // ✅ Kalau user sudah login, isi form otomatis
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: '' })
    } else {
      setForm({ name: '', email: '', phone: '' })
    }
    setRegisterModal(event)
  }

  const handleRegister = async () => {
    if (!form.name || !form.email) return alert('Nama dan email wajib diisi!')
    setLoading(true)
    try {
      const res = await api.post('/events/register', {
        event_id: registerModal.id,
        user_id: user?.id || null,  // ✅ Kirim user_id kalau sudah login
        name: form.name,
        email: form.email,
        phone: form.phone,
        is_gli_member: user ? 1 : 0,
      })
      setRegisterModal(null)
      setForm({ name: '', email: '', phone: '' })
      // ✅ Simpan data sukses termasuk wa_link
      setSuccessData(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Konfirmasi sebelum tutup form daftar
  const handleCloseRegister = () => {
    if (form.name || form.email || form.phone) {
      setConfirmClose(true)
    } else {
      setRegisterModal(null)
    }
  }

  return (
    <div className="min-h-screen font-poppins relative"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-10">
        {/* NAVBAR */}
        <nav className="flex justify-between items-center px-16 py-5 bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-lg sticky top-0 z-50">
          <h1 className="font-black text-xl text-white">GLI</h1>
          <div className="flex gap-8 text-white text-sm">
            <a href="#home" className="hover:text-green-300 transition">Home</a>
            <a href="#event" className="hover:text-green-300 transition">Event</a>
            <a href="#artikel" className="hover:text-green-300 transition">Artikel</a>
          </div>
          <div className="flex gap-6 items-center">
            {/* ✅ Date & Time Display */}
            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
              <Clock size={16} />
              <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-white/50">|</span>
              <span>{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex gap-3 items-center">
              {user ? (
                <button onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard')}
                  className="px-4 py-2 bg-green-600/80 text-white rounded-xl hover:bg-green-700/90 transition font-bold text-sm border border-white/20">
                  Dashboard →
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="text-white hover:text-green-300 font-bold text-sm">Login</button>
                  <button onClick={() => navigate('/register')} className="px-4 py-2 bg-green-600/80 text-white rounded-xl hover:bg-green-700/90 transition font-bold text-sm border border-white/20">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section id="home" className="flex flex-col md:flex-row items-center justify-between px-16 py-24 gap-10">
          <div className="max-w-xl">
            <div className="text-white font-black text-6xl mb-8 space-y-2 drop-shadow-lg">
              {[['G', 'reen'], ['L', 'ive'], ['I', 'nitiative']].map(([l, r], i) => (
                <div key={i} className="flex items-center gap-2 overflow-hidden">
                  <span>{l}</span>
                  <span className={`transition-all duration-700 ${show[i] ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>{r}</span>
                </div>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white mb-5 leading-tight drop-shadow-lg">Mulai Aksi Lingkungan</h1>
            <p className="text-white/80 mb-8 leading-relaxed text-lg">Platform untuk membangun komunitas hijau dan aksi nyata menjaga lingkungan.</p>
            <button onClick={() => navigate('/register')}
              className="px-8 py-4 bg-green-600/80 text-white rounded-2xl hover:scale-105 hover:bg-green-700/90 transition shadow-xl font-black border border-white/20">
              Mulai Sekarang 🌿
            </button>
          </div>
          <div className="relative">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[40px] p-6 shadow-2xl">
              <img src="/images/tangan-bumi.jpg" className="w-[360px] h-[280px] object-cover rounded-3xl" />
            </div>
          </div>
        </section>

        {/* BOARD EVENT */}
        <section id="event" className="px-16 py-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-black text-white drop-shadow-lg">Board Event</h2>
              <p className="text-white/60 mt-2 text-sm">Event dari komunitas GLI — ikuti dan berkontribusi!</p>
            </div>
            <button onClick={() => navigate(user ? (user.role === 'admin' ? '/admin/event' : '/user/event') : '/login')}
              className="px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-black rounded-xl hover:bg-white/20 transition backdrop-blur-sm">
              {user ? 'Buat Event →' : 'Login untuk Buat Event →'}
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm">
              <p className="text-white/40 font-black uppercase tracking-widest">Belum ada event</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => {
                const st = STATUS_MAP[event.status] || STATUS_MAP.roundown
                const isAdmin = event.host_role === 'admin'
                return (
                  <div key={event.id} className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[32px] overflow-hidden shadow-xl hover:scale-[1.02] transition-all">
                    <div className="relative h-44">
                      <EventThumb event={event} />
                      <div className="absolute top-3 left-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isAdmin ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                          {isAdmin ? '👑 Admin' : '🌿 User'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-black text-white text-lg leading-tight mb-2">{event.title}</h3>
                      <p className="text-white/60 text-xs mb-3 line-clamp-2">{event.description}</p>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-white/50 text-xs"><MapPin size={12} /><span>{event.location || 'Online'}</span></div>
                        <div className="flex items-center gap-2 text-white/50 text-xs"><Calendar size={12} /><span>{fmt(event.event_start)}</span></div>
                        <div className="flex items-center gap-2 text-white/50 text-xs"><Users size={12} /><span>{event.total_registered} Terdaftar</span></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailModal(event)}
                          className="flex-1 py-2.5 bg-white/10 border border-white/20 text-white text-xs font-black rounded-xl hover:bg-white/20 transition">
                          Detail
                        </button>
                        {event.status === 'roundown' && (
                          <button onClick={() => handleOpenRegister(event)}
                            className="flex-1 py-2.5 bg-green-500 text-white text-xs font-black rounded-xl hover:bg-green-600 transition">
                            Daftar
                          </button>
                        )}
                        {event.status === 'dilaksanakan' && (
                          <button className="flex-1 py-2.5 bg-yellow-400 text-yellow-900 text-xs font-black rounded-xl cursor-default">Berlangsung</button>
                        )}
                        {event.status === 'berakhir' && (
                          <button className="flex-1 py-2.5 bg-gray-400/30 text-white/50 text-xs font-black rounded-xl cursor-default">Berakhir</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ARTIKEL */}
        <section id="artikel" className="px-16 py-20">
          <h2 className="text-4xl font-black text-white mb-10 drop-shadow-lg">Artikel Terbaru</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.length === 0 ? (
              <div className="col-span-full text-center py-8 text-white/40">Belum ada artikel</div>
            ) : articles.map((a, i) => (
              <div key={a.id || i} className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[32px] p-6 shadow-xl hover:scale-105 transition">
                {getImageUrl(a.img) ? (
                  <img src={getImageUrl(a.img)} className="w-full h-40 object-cover rounded-2xl mb-4" alt={a.title} />
                ) : (
                  <div className="w-full h-40 bg-white/10 rounded-2xl mb-4 flex items-center justify-center">
                    <span className="text-2xl">📰</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
                <p className="text-white/70 text-sm line-clamp-3">{a.description || a.desc || ''}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="px-16 py-10 border-t border-white/10 text-center text-white/40 text-sm">
          © 2026 Green Lifestyle Initiative. All rights reserved.
        </footer>
      </div>

      {/* ==================== MODAL DETAIL ==================== */}
      {detailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-52">
              <EventThumb event={detailModal} />
              <button onClick={() => setDetailModal(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition">
                <X size={14} />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${detailModal.host_role === 'admin' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                  {detailModal.host_role === 'admin' ? '👑 Admin' : '🌿 User'} · {detailModal.host_name}
                </span>
              </div>
              <div className="absolute bottom-3 right-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${STATUS_MAP[detailModal.status]?.color}`}>
                  {STATUS_MAP[detailModal.status]?.label}
                </span>
              </div>
            </div>

            <div className="p-7">
              <h2 className="font-black text-2xl text-gray-800 mb-2">{detailModal.title}</h2>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{detailModal.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  ['Lokasi', detailModal.location || 'Online'],
                  ['Peserta', `${detailModal.total_registered} orang`],
                  ['Mulai Pelaksanaan', fmtDT(detailModal.event_start)],
                  ['Pendaftaran s/d', fmtDT(detailModal.registration_end)],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{label}</p>
                    <p className="text-sm font-bold text-gray-700">{val}</p>
                  </div>
                ))}
              </div>

              {/* WA link di detail kalau dilaksanakan */}
              {detailModal.status === 'dilaksanakan' && detailModal.wa_link && (
                <a href={detailModal.wa_link} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-black text-sm rounded-2xl hover:bg-green-600 transition mb-3">
                  <ExternalLink size={16} /> Bergabung ke Grup WA
                </a>
              )}

              <div className="flex gap-2">
                {detailModal.status === 'roundown' && (
                  <button onClick={() => { setDetailModal(null); handleOpenRegister(detailModal) }}
                    className="flex-1 py-3 bg-green-500 text-white font-black text-sm rounded-2xl hover:bg-green-600 transition">
                    Daftar Sekarang
                  </button>
                )}
                <button onClick={() => setDetailModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 font-black text-sm rounded-2xl hover:bg-gray-200 transition">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DAFTAR ==================== */}
      {registerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleCloseRegister}>
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="font-black text-xl text-gray-800">Daftar Event</h2>
                <p className="text-gray-400 text-xs font-bold mt-0.5 uppercase tracking-widest">{registerModal.title}</p>
              </div>
              <button onClick={handleCloseRegister} className="text-gray-300 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Info member GLI */}
            {user ? (
              <div className="bg-green-50 rounded-2xl p-3 mb-4 flex items-center gap-2 text-green-700 text-xs font-bold">
                <CheckCircle size={14} /> Kamu terdaftar sebagai Member GLI — akan mendapat medali digital setelah event!
              </div>
            ) : (
              <div className="bg-blue-50 rounded-2xl p-3 mb-4 text-xs text-blue-600 font-bold">
                💡 Punya akun GLI? <span className="underline cursor-pointer font-black" onClick={() => navigate('/login')}>Login</span> untuk mendapat medali digital!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nama Lengkap *</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <User size={16} className="text-gray-400" />
                  <input placeholder="Nama kamu" className="bg-transparent border-none outline-none text-sm font-bold w-full"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Email *</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <Mail size={16} className="text-gray-400" />
                  <input type="email" placeholder="email@gmail.com" className="bg-transparent border-none outline-none text-sm font-bold w-full"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    readOnly={!!user} // ✅ Kalau sudah login, email tidak bisa diubah
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">No. Telepon</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <Phone size={16} className="text-gray-400" />
                  <input placeholder="08xxxxxxxxxx" className="bg-transparent border-none outline-none text-sm font-bold w-full"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleRegister} disabled={loading}
                className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition disabled:opacity-50">
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
              <button onClick={handleCloseRegister} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL KONFIRMASI TUTUP ==================== */}
      {confirmClose && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-8 text-center">
            <h3 className="font-black text-xl text-gray-800 mb-2">Yakin keluar?</h3>
            <p className="text-gray-500 text-sm mb-6">Data yang sudah diisi akan hilang.</p>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmClose(false); setRegisterModal(null) }}
                className="flex-1 py-3 bg-red-50 text-red-500 font-black rounded-2xl hover:bg-red-100 transition">
                Ya, Keluar
              </button>
              <button onClick={() => setConfirmClose(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition">
                Lanjut Isi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL SUKSES DAFTAR ==================== */}
      {successData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="font-black text-2xl text-gray-800 mb-1">Berhasil Terdaftar!</h2>
            <p className="text-gray-400 text-sm mb-1 font-bold">{successData.event_title}</p>

            {/* ✅ Tampilkan status GLI member */}
            {successData.is_gli_member ? (
              <div className="bg-green-50 rounded-2xl p-3 mt-4 mb-4 text-xs text-green-700 font-bold">
                🏅 Kamu terdaftar sebagai Member GLI! Upload bukti foto saat event berlangsung untuk mendapat <strong>{successData.medal_name}</strong>.
              </div>
            ) : (
              <div className="bg-blue-50 rounded-2xl p-3 mt-4 mb-4 text-xs text-blue-600 font-bold">
                👤 Kamu terdaftar sebagai Guest. <span className="underline cursor-pointer" onClick={() => { setSuccessData(null); navigate('/register') }}>Daftar GLI</span> untuk dapat medali digital!
              </div>
            )}

            {/* ✅ Tampilkan link WA kalau ada */}
            {successData.wa_link && (
              <a href={successData.wa_link} target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-black text-sm rounded-2xl hover:bg-green-600 transition mb-3">
                <ExternalLink size={16} /> Bergabung ke Grup WA
              </a>
            )}

            {/* Info kalau WA belum tersedia (event masih roundown) */}
            {!successData.wa_link && (
              <p className="text-gray-400 text-xs mb-4">Link grup WA akan tersedia saat event mulai dilaksanakan.</p>
            )}

            <button onClick={() => setSuccessData(null)}
              className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ==================== PROFESSIONAL FOOTER ==================== */}
      <footer className="relative mt-20 bg-black/20 backdrop-blur-md border-t border-white/20 py-16 px-16">
        <div className="max-w-7xl mx-auto">
          {/* Footer Top - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Column 1: About */}
            <div className="text-white">
              <h3 className="font-black text-lg mb-4 text-green-300">GLI Platform</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Green Lifestyle Initiative adalah platform untuk mengubah kesadaran lingkungan menjadi aksi nyata dengan gamifikasi yang menyenangkan.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-green-500/30 flex items-center justify-center transition text-white/60 hover:text-green-300 text-xs font-bold">f</a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-green-500/30 flex items-center justify-center transition text-white/60 hover:text-green-300 text-xs font-bold">ig</a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-green-500/30 flex items-center justify-center transition text-white/60 hover:text-green-300 text-xs font-bold">tw</a>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="text-white">
              <h3 className="font-black text-lg mb-4 text-green-300">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="text-white/70 hover:text-green-300 transition">🏠 Home</a></li>
                <li><a href="#event" className="text-white/70 hover:text-green-300 transition">🎪 Event</a></li>
                <li><a href="#artikel" className="text-white/70 hover:text-green-300 transition">📚 Artikel</a></li>
                <li><a href="/dashboard" className="text-white/70 hover:text-green-300 transition">📊 Dashboard</a></li>
              </ul>
            </div>

            {/* Column 3: Features */}
            <div className="text-white">
              <h3 className="font-black text-lg mb-4 text-green-300">Fitur</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-white/70 hover:text-green-300 transition">✅ Aksi Hijau</a></li>
                <li><a href="/" className="text-white/70 hover:text-green-300 transition">🏆 Medal & Leaderboard</a></li>
                <li><a href="/" className="text-white/70 hover:text-green-300 transition">🎯 Gamifikasi</a></li>
                <li><a href="/" className="text-white/70 hover:text-green-300 transition">👥 Komunitas</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Legal */}
            <div className="text-white">
              <h3 className="font-black text-lg mb-4 text-green-300">Kontak</h3>
              <ul className="space-y-3 text-sm">
                <li className="text-white/70">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Email</p>
                  <a href="mailto:support@gli-project.com" className="hover:text-green-300 transition">support@gli-project.com</a>
                </li>
                <li className="text-white/70">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Lokasi</p>
                  <span>Indonesia 🇮🇩</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left: Copyright */}
            <div className="text-white/60 text-xs text-center md:text-left">
              <p className="mb-1">© 2026 Green Lifestyle Initiative. All rights reserved.</p>
              <p>Platform untuk aksi lingkungan nyata bersama komunitas global 🌍</p>
            </div>

            {/* Right: Legal Links */}
            <div className="flex gap-6 text-white/60 text-xs">
              <a href="/" className="hover:text-green-300 transition">Privacy Policy</a>
              <a href="/" className="hover:text-green-300 transition">Terms of Service</a>
              <a href="/" className="hover:text-green-300 transition">Cookie Policy</a>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-white/50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Platform Status: <strong className="text-green-300">Operational</strong> • v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}