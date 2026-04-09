import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserSidebar from '../../components/UserSidebar'
import { useAuth } from '../../context/AuthContext'
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userStats, setUserStats] = useState({ totalPoints: 0, totalActions: 0, approved: 0, pending: 0, rejected: 0 })

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await api.get(`/user/stats/${user?.id}`)

        setUserStats(res.data)
      } catch (err) {
        console.error("Gagal ambil stats user:", err)
      }
    }

    if (user?.id) fetchUserStats()
  }, [user])

  return (
    <div className="flex min-h-screen">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-8" style={{ background: BG }}>
        <h1 className="font-black text-3xl text-white mb-0.5">Halo, Selamat Datang!</h1>
        <div className="text-green-400 text-sm font-semibold mb-7 uppercase tracking-widest">
          Status: {user?.role || 'Contributor'}
        </div>

        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className="rounded-2xl p-6 shadow-lg flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', minHeight: '130px' }}>
            <div className="text-sm text-white/90 font-bold flex items-center gap-2">⊕ Total Poin</div>
            <div className="text-4xl font-black text-white">{userStats.totalPoints}</div>
          </div>
          <div className="rounded-2xl p-6 shadow-lg flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', minHeight: '130px' }}>
            <div className="text-sm text-white/90 font-bold flex items-center gap-2">🌿 Total Aksi</div>
            <div className="text-4xl font-black text-white">{userStats.totalActions}</div>
          </div>
        </div>

        <h2 className="font-extrabold text-xl text-white mb-4">Status Kontribusi</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-md" style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)' }}>
            <div className="text-white font-black text-2xl">{userStats.approved}</div>
            <span className="text-white font-bold text-[10px] uppercase">Disetujui</span>
          </div>
          <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-md" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <div className="text-white font-black text-2xl">{userStats.pending}</div>
            <span className="text-white font-bold text-[10px] uppercase">Tertunda</span>
          </div>
          <div onClick={() => navigate('/user/riwayat')} className="rounded-2xl py-7 flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 transition-all shadow-md" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <div className="text-white font-black text-2xl">{userStats.rejected}</div>
            <span className="text-white font-bold text-[10px] uppercase">Ditolak</span>
          </div>
        </div>
      </main>
    </div>
  )
}