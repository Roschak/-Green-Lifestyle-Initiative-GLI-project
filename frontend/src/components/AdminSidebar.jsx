import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Shield, Users, LogOut, Mail, BadgeCheck, X, CheckCircle, XCircle, Clock, User, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function AdminSidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const [showPopup, setShowPopup]   = useState(false)
  const [adminStats, setAdminStats] = useState(null)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (showPopup && !adminStats) {
      setLoading(true)
      const token = localStorage.getItem('token')
      axios.get('http://localhost:5000/api/admin/profile/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setAdminStats(res.data))
        .catch(err => console.error('Gagal ambil admin stats:', err))
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
    { path: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { path: '/admin/moderasi',   label: 'Moderasi',   icon: Shield },
    { path: '/admin/monitoring', label: 'Monitoring', icon: Users },
    { path: '/admin/event',      label: 'Event',      icon: CalendarDays },
    { path: '/admin/profil',     label: 'Profil',     icon: User },
  ]

  return (
    <>
      <aside className="w-64 min-h-screen flex flex-col flex-shrink-0 sticky top-0 h-screen"
        style={{ background: 'linear-gradient(180deg, #1B4332 0%, #2D6A4F 100%)' }}>

        <div className="p-5 pb-3">
          <div onClick={() => setShowPopup(true)}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all select-none">
            <div className="w-10 h-10 rounded-full border-2 border-green-400 flex items-center justify-center flex-shrink-0 bg-green-50">
              <span className="text-green-700 font-black text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-green-900 font-bold text-sm truncate">{user?.name?.split(' ')[0] || 'Admin'}</div>
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
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <div key={item.path} onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 cursor-pointer text-white font-medium text-sm transition-all
                  ${isActive ? 'bg-white/20 font-bold shadow-inner' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                <Icon size={18} /> {item.label}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* POPUP DI TENGAH */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 relative">
              <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-full">
                <X size={18} />
              </button>
              <div className="w-16 h-16 rounded-[20px] bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3">
                <span className="text-white font-black text-2xl">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              </div>
              <h2 className="text-white font-black text-xl uppercase italic tracking-tighter">{user?.name || 'Admin'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={10} className="text-white" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Administrator</span>
                </div>
              </div>
            </div>

            <div className="px-6 pt-5 space-y-2">
              <div className="flex items-center gap-3 text-gray-500">
                <Mail size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-xs font-bold truncate">{user?.email || '-'}</span>
              </div>
            </div>

            <div className="px-6 pt-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Statistik Verifikasi</p>
              {loading ? (
                <div className="text-center py-4 text-gray-300 text-[10px] font-bold animate-pulse uppercase">Memuat...</div>
              ) : adminStats ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 bg-green-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Total Diverifikasi</p>
                      <p className="text-3xl font-black text-green-700">{adminStats.totalVerified}</p>
                    </div>
                    <Shield size={28} className="text-green-300" />
                  </div>
                  <div className="bg-green-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-1"><CheckCircle size={11} className="text-green-500" /><p className="text-[9px] font-black text-gray-400 uppercase">Disetujui</p></div>
                    <p className="text-xl font-black text-green-600">{adminStats.approved}</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-1"><XCircle size={11} className="text-red-400" /><p className="text-[9px] font-black text-gray-400 uppercase">Ditolak</p></div>
                    <p className="text-xl font-black text-red-500">{adminStats.rejected}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-1"><Clock size={11} className="text-yellow-500" /><p className="text-[9px] font-black text-gray-400 uppercase">Pending</p></div>
                    <p className="text-xl font-black text-yellow-600">{adminStats.pending}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-3">
                    <div className="flex items-center gap-1 mb-1"><User size={11} className="text-blue-400" /><p className="text-[9px] font-black text-gray-400 uppercase">Total User</p></div>
                    <p className="text-xl font-black text-blue-500">{adminStats.totalUsers}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-gray-300 text-[10px]">Gagal memuat data</div>
              )}
            </div>

            <div className="p-6 space-y-2">
              <button onClick={() => { setShowPopup(false); navigate('/admin/profil') }}
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