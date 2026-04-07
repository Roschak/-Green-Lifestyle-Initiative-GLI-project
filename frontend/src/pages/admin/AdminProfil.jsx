import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { Shield, CheckCircle, XCircle, Clock, Users, Mail, BadgeCheck, Activity } from 'lucide-react'
import axios from 'axios'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function AdminProfil() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const adminUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/admin/profile/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(res.data)
    } catch (err) {
      console.error('Gagal ambil stats admin:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="font-black text-4xl text-white italic uppercase tracking-tighter mb-2">Profil Admin</h1>
        <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10">
          Informasi & Statistik Administrator
        </p>

        {/* KARTU PROFIL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Info Admin */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Avatar */}
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-6 shadow-lg shadow-green-300/30">
                <span className="text-white font-black text-3xl">
                  {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>

              <h2 className="font-black text-2xl text-gray-800 uppercase italic tracking-tighter mb-1">
                {adminUser?.name || 'Admin'}
              </h2>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full mb-6">
                <BadgeCheck size={12} className="text-green-600" />
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Administrator</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Mail size={14} className="text-green-500" />
                  </div>
                  <span className="text-sm font-bold truncate">{adminUser?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Activity size={14} className="text-green-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-green-500">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistik Utama */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center text-white/40 font-black uppercase tracking-widest animate-pulse">
                Memuat statistik...
              </div>
            ) : stats ? (
              <>
                {/* Total Diverifikasi */}
                <div className="col-span-2 bg-white rounded-[32px] p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Aksi Diverifikasi</p>
                    <h3 className="text-5xl font-black text-green-700 italic">{stats.totalVerified}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1">dari semua waktu</p>
                  </div>
                  <div className="w-16 h-16 rounded-[20px] bg-green-100 flex items-center justify-center">
                    <Shield size={32} className="text-green-600" />
                  </div>
                </div>

                {/* Disetujui */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-green-500" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disetujui</p>
                  </div>
                  <h3 className="text-4xl font-black text-green-600">{stats.approved}</h3>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: stats.totalVerified > 0 ? `${(stats.approved / stats.totalVerified) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Ditolak */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={16} className="text-red-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ditolak</p>
                  </div>
                  <h3 className="text-4xl font-black text-red-500">{stats.rejected}</h3>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: stats.totalVerified > 0 ? `${(stats.rejected / stats.totalVerified) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Pending */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-yellow-500" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Menunggu</p>
                  </div>
                  <h3 className="text-4xl font-black text-yellow-600">{stats.pending}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">Belum diverifikasi</p>
                </div>

                {/* Total User */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} className="text-blue-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total User</p>
                  </div>
                  <h3 className="text-4xl font-black text-blue-500">{stats.totalUsers}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                    {stats.onlineUsers} sedang online
                  </p>
                </div>
              </>
            ) : (
              <div className="col-span-2 text-center text-white/40 font-black uppercase">Gagal memuat data</div>
            )}
          </div>
        </div>

        {/* PERSENTASE VERIFIKASI */}
        {stats && stats.totalVerified > 0 && (
          <div className="bg-white rounded-[40px] p-8 shadow-2xl">
            <h3 className="font-black text-gray-800 uppercase italic text-xl mb-6">Tingkat Persetujuan</h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Approval Rate</span>
                  <span className="font-black text-green-600">
                    {Math.round((stats.approved / stats.totalVerified) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                    style={{ width: `${(stats.approved / stats.totalVerified) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Rejection Rate</span>
                  <span className="font-black text-red-500">
                    {Math.round((stats.rejected / stats.totalVerified) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all"
                    style={{ width: `${(stats.rejected / stats.totalVerified) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}