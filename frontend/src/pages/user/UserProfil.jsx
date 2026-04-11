import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import UserSidebar from '../../components/UserSidebar'
import { useAuth } from '../../context/AuthContext'
import { Lock, Bell, LogOut, ChevronRight } from 'lucide-react'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M8 21h8M12 17v4M7 4H4v3a3 3 0 003 3m10-6h3v3a3 3 0 01-3 3M5 7a7 7 0 0014 0V4H5v3z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const StarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const medals = [
  { icon: '⚡', label: 'PAHLAWAN ENERGI', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', locked: false },
  { icon: '💧', label: 'HEMAT AIR', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', locked: false },
  { icon: '♻️', label: 'DAUR ULANG', bg: 'linear-gradient(135deg,#4ade80,#22c55e)', locked: false },
  { icon: '🌲', label: 'PENANAM POHON', bg: 'linear-gradient(135deg,#22c55e,#15803d)', locked: false },
  { icon: 'trophy', label: 'PIONIR HIJAU', bg: 'rgba(255,255,255,0.12)', locked: true },
  { icon: 'star', label: 'AKTIVIS ELITE', bg: 'rgba(255,255,255,0.12)', locked: true },
]

function MedalIcon({ medal }) {
  if (!medal.locked) return <span className="text-3xl">{medal.icon}</span>
  if (medal.icon === 'trophy') return <TrophyIcon />
  return <StarIcon />
}

export default function UserProfil() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const handleLogout = () => { logout(); navigate('/login') }
  const getInit = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'BS'

  // ✅ Fetch real user profile data from API
  useEffect(() => {
    if (!user?.id) return
    
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/user/profile/${user.id}`)
        setProfile(res.data)
      } catch (err) {
        console.error('❌ Error fetching profile:', err)
        setProfile({
          level: user.level || 'Eco-Newbie',
          total_actions: 0,
          medal: ''
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: BG }}>
        <UserSidebar/>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-white">Loading profile...</div>
        </main>
      </div>
    )
  }

  // ✅ Parse medals from profile.medal string
  const userMedals = profile?.medal
    ? profile.medal.split(', ').filter(m => m.trim())
    : []

  const medalConfig = {
    'PAHLAWAN ENERGI': {icon:'⚡', bg:'linear-gradient(135deg,#fbbf24,#f59e0b)'},
    'HEMAT AIR': {icon:'💧', bg:'linear-gradient(135deg,#60a5fa,#3b82f6)'},
    'DAUR ULANG': {icon:'♻️', bg:'linear-gradient(135deg,#4ade80,#22c55e)'},
    'PENANAM POHON': {icon:'🌲', bg:'linear-gradient(135deg,#22c55e,#15803d)'},
    'PIONIR HIJAU': {icon:'trophy', bg:'rgba(255,255,255,0.12)'},
    'AKTIVIS ELITE': {icon:'star', bg:'rgba(255,255,255,0.12)'},
  }

  const displayMedals = userMedals.length > 0 
    ? userMedals.map(name => ({
        label: name,
        icon: medalConfig[name]?.icon || '🏅',
        bg: medalConfig[name]?.bg || 'rgba(255,255,255,0.12)',
        locked: false
      }))
    : medals

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="font-black text-3xl text-white mb-6">Profil Saya</h1>

        {/* Avatar */}
        <div className="text-center mb-7">
          <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-green-400 mx-auto mb-4 relative">
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-green-400 flex items-center justify-center cursor-pointer border-2 border-green-800">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h2 className="font-black text-2xl text-white mb-1">{user?.name || 'Budi Santoso'}</h2>
          <p className="text-sm text-white/45">{user?.email || 'Budisantoso@gmail.com'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-7">
          <div className="bg-white rounded-2xl px-6 py-5 text-center">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-extrabold mb-2">LEVEL</div>
            {/* ✅ Show real level from profile */}
            <div className="text-3xl font-black text-green-400">{profile?.level || 'Eco-Newbie'}</div>
          </div>
          <div className="bg-white rounded-2xl px-6 py-5 text-center">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-extrabold mb-2">AKSI</div>
            {/* ✅ Show real action count from profile */}
            <div className="text-3xl font-black text-green-400">{profile?.total_actions || 0}</div>
          </div>
        </div>

        {/* Medals */}
        <div className="flex items-center gap-4 mb-5">
          <h3 className="font-black text-2xl text-white">Koleksi Medali</h3>
          <span className="text-sm text-white/45 cursor-pointer">Lihat Semua</span>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-8">
          {displayMedals.map((m, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: m.bg, opacity: m.locked ? 0.3 : 1 }}>
                <MedalIcon medal={m} />
              </div>
              <div className={`text-xs font-bold uppercase tracking-wide leading-tight ${m.locked ? 'text-white/20' : 'text-white/65'}`}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <h3 className="font-black text-lg text-white mb-4">Pengaturan Akun</h3>
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500"><Lock size={18} /></div>
            <span className="flex-1 text-sm font-semibold text-gray-800">Ganti Kata Sandi</span>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500"><Bell size={18} /></div>
            <span className="flex-1 text-sm font-semibold text-gray-800">Notifikasi</span>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
          <div onClick={handleLogout} className="rounded-2xl px-5 py-4 flex items-center gap-3 cursor-pointer border border-red-100 hover:bg-red-50 transition-colors" style={{ background: '#fff5f5' }}>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-500"><LogOut size={18} /></div>
            <span className="flex-1 text-sm font-semibold text-red-500">Keluar</span>
            <ChevronRight size={18} className="text-red-400" />
          </div>
        </div>
      </main>
    </div>
  )
}
