import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserSidebar from '../../components/UserSidebar'
import { useAuth } from '../../context/AuthContext'
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts'
import { Clock as ClockIcon } from 'lucide-react'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userStats, setUserStats] = useState({ totalPoints: 0, totalActions: 0, approved: 0, pending: 0, rejected: 0 })

  // ✅ Live clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await api.get(`/user/stats/${user?.id}`)
        // ✅ FIXED: Ensure all fields exist with defaults
        setUserStats({
          totalPoints: res.data?.totalPoints || 0,
          totalActions: res.data?.totalActions || 0,
          approved: res.data?.approved || 0,
          pending: res.data?.pending || 0,
          rejected: res.data?.rejected || 0
        })
        console.log('✅ User stats loaded:', res.data)
      } catch (err) {
        console.error("❌ Gagal ambil stats user:", err)
        // Set defaults on error
        setUserStats({ totalPoints: 0, totalActions: 0, approved: 0, pending: 0, rejected: 0 })
      }
    }

    if (user?.id) fetchUserStats()
  }, [user])

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* ✅ TOP NAVBAR WITH CLOCK */}
        <div className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-40 p-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto px-4">
            <div>
              <h1 className="font-black text-2xl text-white">Halo, Selamat Datang! 👋</h1>
              <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mt-1">
                Status: {user?.role || 'Contributor'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-white font-mono text-lg font-black">
                <ClockIcon size={18} className="text-green-300" />
                {timeStr}
              </div>
              <p className="text-green-200 text-xs font-semibold mt-1">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* ✅ MAIN CONTENT */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm bg-white/10 border border-white/20 flex flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="text-sm text-white/90 font-bold flex items-center gap-2">⊕ Total Poin</div>
              <div className="text-4xl font-black text-green-300">{userStats.totalPoints}</div>
            </div>
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm bg-white/10 border border-white/20 flex flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="text-sm text-white/90 font-bold flex items-center gap-2">🌿 Total Aksi</div>
              <div className="text-4xl font-black text-green-300">{userStats.totalActions}</div>
            </div>
          </div>

          <h2 className="font-extrabold text-xl text-white mb-4">Status Kontribusi</h2>
          <div className="grid grid-cols-3 gap-4">
            <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-lg backdrop-blur-sm bg-white/10 border border-white/20 hover:border-green-400">
              <div className="text-white font-black text-2xl">{userStats.approved}</div>
              <span className="text-white font-bold text-[10px] uppercase">Disetujui</span>
            </div>
            <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-lg backdrop-blur-sm bg-white/10 border border-white/20 hover:border-yellow-400">
              <div className="text-white font-black text-2xl">{userStats.pending}</div>
              <span className="text-white font-bold text-[10px] uppercase">Tertunda</span>
            </div>
            <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-lg backdrop-blur-sm bg-white/10 border border-white/20 hover:border-red-400">
              <div className="text-white font-black text-2xl">{userStats.rejected}</div>
              <span className="text-white font-bold text-[10px] uppercase">Ditolak</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}