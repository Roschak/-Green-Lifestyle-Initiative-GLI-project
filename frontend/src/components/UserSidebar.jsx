import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Leaf, History, Trophy, LogOut, Mail, Star, X, CheckCircle, XCircle, Clock, Medal, User, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const MEDAL_EMOJI = {
  'PAHLAWAN ENERGI': '⚡', 'HEMAT AIR': '💧', 'DAUR ULANG': '♻️',
  'PENANAM POHON': '🌲', 'PIONIR HIJAU': '🏆', 'AKTIVIS ELITE': '⭐',
}

export default function UserSidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const [showPopup, setShowPopup] = useState(false)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (showPopup && !profile && user?.id) {
      setLoading(true)
      const token = localStorage.getItem('token')
      axios.get(`http://localhost:5000/api/user/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setProfile(res.data))
        .catch(err => console.error('Gagal ambil profil:', err))
        .finally(() => setLoading(false))
    }
  }, [showPopup])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowPopup(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    setShowPopup(false)
    await logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/user/aksi',      label: 'Aksi',      icon: Leaf },
    { path: '/user/riwayat',   label: 'Riwayat',   icon: History },
    { path: '/user/peringkat', label: 'Peringkat', icon: Trophy },
    { path: '/user/event',     label: 'Event',     icon: CalendarDays },
  ]

  return (
    <>
      <aside className="w-64 min-h-screen flex flex-col flex-shrink-0 sticky top-0 h-screen"
        style={{ background: 'linear-gradient(180deg, #1B4332 0%, #2D6A4F 100%)' }}>

        <div className="p-5 pb-3">
          <div onClick={() => setShowPopup(true)}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all select-none">
            <div className="w-10 h-10 rounded-full border-2 border-green-400 flex items-center justify-center flex-shrink-0 bg-green-50">
              <span className="text-green-700 font-black text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-green-900 font-bold text-sm truncate">{user?.name?.split(' ')[0] || 'User'}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <div className="text-green-500 text-[10px] font-bold uppercase tracking-wider">online</div>
              </div>
            </div>
            <div className="text-green-400 text-[10px] font-black">{showPopup ? '▴' : '▾'}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <div key={item.path} onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 cursor-pointer text-white font-medium text-sm transition-all
                  ${isActive ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                <Icon size={18} /> {item.label}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* POPUP DI TENGAH */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-700 to-green-500 p-6 relative">
              <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-full">
                <X size={18} />
              </button>
              <div className="w-16 h-16 rounded-[20px] bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3">
                <span className="text-white font-black text-2xl">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <h2 className="text-white font-black text-xl uppercase italic tracking-tighter">{user?.name || 'User'}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {profile && (
                  <>
                    <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{profile.level}</span>
                    <span className="bg-yellow-400/80 text-green-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Rank #{profile.ranking}</span>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-300 text-[10px] font-bold animate-pulse uppercase tracking-widest">Memuat...</div>
            ) : profile ? (
              <>
                <div className="px-6 pt-5 space-y-2">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Mail size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs font-bold truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <Star size={14} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-xs font-black text-green-600">{profile.points} Total Poin · {profile.monthlyPoints} Bulan Ini</span>
                  </div>
                </div>

                <div className="px-6 pt-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Statistik Aksi</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 rounded-2xl p-3 text-center">
                      <CheckCircle size={14} className="text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-green-600">{profile.approved}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Selesai</p>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-3 text-center">
                      <Clock size={14} className="text-yellow-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-yellow-600">{profile.pending}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Pending</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center">
                      <XCircle size={14} className="text-red-400 mx-auto mb-1" />
                      <p className="text-lg font-black text-red-500">{profile.rejected}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Ditolak</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Koleksi Medal {profile.medals?.length > 0 ? `(${profile.medals.length})` : ''}
                  </p>
                  {profile.medals?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.medals.map((medal, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                          <span className="text-sm">{MEDAL_EMOJI[medal] || '🏅'}</span>
                          <span className="text-[8px] font-black text-yellow-700 uppercase">{medal}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-gray-300">
                      <Medal size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Belum ada medal</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-gray-300 text-[10px]">Gagal memuat data</div>
            )}

            <div className="p-6 space-y-2 mt-2">
              <button onClick={() => { setShowPopup(false); navigate('/user/profil') }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">
                <User size={14} /> Lihat Profil Lengkap
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}