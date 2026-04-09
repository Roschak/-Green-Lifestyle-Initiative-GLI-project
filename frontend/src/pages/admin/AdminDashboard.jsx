import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { Bell, Users, X, Clock, Calendar, Trophy, ArrowUpRight, Activity } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)

  const [stats, setStats] = useState({
    totalUsers: 0,
    pending: 0,
    rejected: 0,
    onlineUsers: 0,
    topLeaderboard: 'Memuat...',
    topPoints: 0,
    currentSeason: ''
  })

  // ✅ chartData untuk grafik 7 hari (tidak difilter tanggal)
  const [chartData, setChartData] = useState([])

  // ✅ allActions = semua pending dari backend
  // recentActions = yang ditampilkan (bisa difilter tanggal)
  const [allActions, setAllActions] = useState([])
  const [recentActions, setRecentActions] = useState([])
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/stats')

        setStats(res.data)

        // ✅ FIX: chartData langsung dari backend (sudah format {name, value})
        setChartData(res.data.chartData || [])

        // ✅ FIX: recent dari backend sudah hanya pending
        const mappedActions = (res.data.recent || []).map(action => ({
          id: action.id,
          initials: action.user_name
            ? action.user_name.split(' ').map(n => n[0]).join('').toUpperCase()
            : '??',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
          name: action.user_name || 'Unknown User',
          rawDate: action.created_at,
          time: new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cat: action.action_name || 'General',
          desc: action.description || 'Tidak ada deskripsi'
        }))

        setAllActions(mappedActions)
        setRecentActions(mappedActions)

      } catch (err) {
        console.error('Gagal ambil data stats:', err)
      }
    }

    fetchData()
  }, [])

  // ✅ FIX: Filter tanggal untuk Recent Actions (bukan chart)
  useEffect(() => {
    if (!filterDate) {
      setRecentActions(allActions)
    } else {
      const filtered = allActions.filter(item => {
        const itemDate = new Date(item.rawDate).toISOString().split('T')[0]
        return itemDate === filterDate
      })
      setRecentActions(filtered)
    }
  }, [filterDate, allActions])

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">

        {/* HEADER DASHBOARD */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Command Center</h1>
            <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
              Active Season: {stats.currentSeason || 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <Calendar size={18} className="text-green-400" />
            <span className="text-white text-sm font-black uppercase tracking-widest">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* CHART AKTIVITAS (2/3 Lebar) */}
          <div className="lg:col-span-2 bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-black text-gray-800 uppercase italic text-xl">Platform Traffic</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Aktivitas 7 Hari Terakhir</p>
              </div>
            </div>

            {/* ✅ FIX: XAxis sekarang pakai dataKey="name" agar label tanggal muncul */}
            <div className="h-48">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-300 font-black uppercase text-xs tracking-widest">
                  Belum ada aktivitas 7 hari terakhir
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {/* ✅ FIX: dataKey="name" supaya sumbu X tampil label tanggal */}
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1B4332',
                        border: 'none',
                        borderRadius: '15px',
                        color: 'white',
                        fontSize: '12px'
                      }}
                      formatter={(val) => [`${val} Aksi`, 'Total']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={4}
                      fill="url(#colorGreen)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* SEASON MONITORING (1/3 Lebar) */}
          <div className="bg-[#1B4332] border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col justify-between group hover:border-green-400 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-yellow-400 rounded-2xl text-green-900 shadow-lg shadow-yellow-400/20">
                <Trophy size={28} />
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Top Performer</p>
                <Activity size={18} className="text-green-400 ml-auto mt-2 animate-pulse" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-white/40 text-[10px] font-black uppercase mb-1">Juara Sementara:</p>
              <h2 className="text-3xl font-black text-white italic uppercase truncate tracking-tighter mb-1">
                {stats.topLeaderboard}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-500/20 rounded-lg text-green-400 font-black text-xs">
                  {stats.topPoints} GREEN POINTS
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/monitoring')}
              className="w-full mt-8 py-4 bg-white/5 hover:bg-green-400 hover:text-green-900 border border-white/10 text-white font-black text-[10px] rounded-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Buka Monitoring <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* QUICK STATS & RECENT TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* STATS COLUMN */}
          <div className="space-y-6">
            {[
              { label: 'Total User', val: stats.totalUsers, icon: <Users />, color: 'text-blue-400' },
              { label: 'Pending', val: stats.pending, icon: <Clock />, color: 'text-yellow-400' },
              { label: 'Rejected', val: stats.rejected, icon: <X />, color: 'text-red-400' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] font-black uppercase">{item.label}</p>
                    <h3 className="text-2xl font-black text-white mt-1">{item.val}</h3>
                  </div>
                  <div className={`${item.color} opacity-50`}>{item.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TABLE COLUMN (3/4 Lebar) */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-gray-800 uppercase italic">Recent Action Requests</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Menunggu Verifikasi</p>
              </div>
              <div className="flex items-center gap-3">
                {/* ✅ Filter tanggal dipindah ke sini, relevan untuk recent actions */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-gray-100 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 ring-green-400"
                />
                <button
                  onClick={() => navigate('/admin/moderasi')}
                  className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline whitespace-nowrap"
                >
                  Manage All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {recentActions.length > 0 ? recentActions.map((row) => (
                <div key={row.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[24px] border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg"
                      style={{ background: row.color }}
                    >
                      {row.initials}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800 leading-tight">{row.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{row.cat}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-300 font-bold">{row.time}</span>
                    <button
                      onClick={() => setModal(row)}
                      className="px-6 py-2 bg-green-400 text-green-950 font-black text-[10px] rounded-xl uppercase tracking-tighter hover:bg-green-500 transition-colors"
                    >
                      Periksa
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-gray-300 font-black uppercase text-xs tracking-[0.3em]">
                  {filterDate ? 'Tidak ada aksi pada tanggal ini' : 'Tidak ada aksi pending'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DETAIL */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#1B4332] border border-white/10 rounded-[40px] p-10 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-white font-black text-3xl italic uppercase tracking-tighter mb-2">{modal.name}</h2>
            <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase rounded-lg mb-6 tracking-widest">
              Category: {modal.cat}
            </div>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 italic text-white/70 text-sm leading-relaxed mb-8">
              "{modal.desc}"
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setModal(null); navigate('/admin/moderasi') }}
                className="py-4 bg-green-400 text-green-950 font-black rounded-2xl text-[10px] uppercase hover:scale-95 transition-all"
              >
                Verifikasi
              </button>
              <button
                onClick={() => setModal(null)}
                className="py-4 bg-white/5 text-white/50 font-black rounded-2xl text-[10px] uppercase hover:bg-white/10 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}