import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { Bell, Search, Activity, Clock, Users, Loader2, RefreshCw, X, Trophy, Medal, User, Eye } from 'lucide-react'

/** * PERBAIKAN JALUR IMPORT (FULL FIX):
 * Karena AdminMonitoring ada di /src/pages/admin/
 * Mundur 1x (../) ke /pages/
 * Mundur 2x (../../) ke /src/
 * Baru masuk ke /service/api
 */
import { getAllUsers, getUserDetail } from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function AdminMonitoring() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoadingId, setDetailLoadingId] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await getAllUsers()
      setUsers(res.data) 
    } catch (err) {
      console.error("Gagal load data user:", err)
    } finally {
      setLoading(false)
    }
  }

 const handleUserClick = async (id) => {
  console.log("CLICK:", id)

  setDetailLoadingId(id)
  try {
    const res = await getUserDetail(id)
    console.log("DETAIL:", res.data)
    setSelectedUser(res.data)
  } catch (err) {
    console.error("ERROR:", err.response || err)
  } finally {
    setDetailLoadingId(null)
  }
}

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen relative" style={{ background: BG }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="flex justify-between items-center px-8 py-7 border-b border-white/10 sticky top-0 bg-[#004D40]/80 backdrop-blur-md z-30">
          <div>
            <h1 className="font-black text-3xl text-white tracking-tighter uppercase italic leading-none">User Monitoring</h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Global Activity & Status</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={fetchUsers} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="flex items-center gap-4 text-white/50 text-sm font-bold border-l border-white/10 pl-6">
              <Bell size={22} className="text-white" />
              <span className="uppercase tracking-widest text-[11px] font-black">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[32px] shadow-xl text-center">
              <Activity className="text-green-400 mx-auto mb-2" size={24} />
              <div className="text-3xl font-black text-white">{users.filter(u => u.status === 'online').length}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">User Online</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[32px] shadow-xl text-center">
              <Users className="text-blue-400 mx-auto mb-2" size={24} />
              <div className="text-3xl font-black text-white">{users.length}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total User</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[32px] shadow-xl text-center">
              <Clock className="text-yellow-400 mx-auto mb-2" size={24} />
              <div className="text-3xl font-black text-white">{users.filter(u => u.status !== 'online').length}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">User Offline</div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100">
            <div className="flex flex-col md:row justify-between items-center mb-10 gap-4">
              <h2 className="text-xl font-black text-gray-800 uppercase italic flex items-center gap-3">
                <div className="w-2 h-6 bg-green-500 rounded-full" />
                Daftar Pengguna
              </h2>
              <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 w-full md:w-80">
                <Search size={16} className="text-gray-400" />
                <input 
                  placeholder="CARI NAMA ATAU EMAIL..." 
                  className="bg-transparent border-none outline-none text-[11px] font-black uppercase w-full placeholder:text-gray-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-50 text-left">
                    <th className="pb-5 text-[10px] font-black text-gray-300 uppercase px-2 tracking-widest">User Profile</th>
                    <th className="pb-5 text-[10px] font-black text-gray-300 uppercase px-2 tracking-widest text-center">Live Status</th>
                    <th className="pb-5 text-[10px] font-black text-gray-300 uppercase px-2 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[10px] uppercase font-black">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-green-50/50 transition-all cursor-default">
                      <td className="py-5 px-2">
                        <div className="flex items-center gap-4 text-left">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.status === 'online' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {user.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-800 leading-none mb-1 uppercase italic">{user.name}</div>
                            <div className="text-[9px] text-gray-400 lowercase font-bold">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          <span className={`${user.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>{user.status}</span>
                        </div>
                      </td>
                      <td className="py-5 px-2 text-right">
                        <button 
                          onClick={() => handleUserClick(user.id)}
                          className="px-4 py-2 bg-gray-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 ml-auto shadow-sm"
                        >
                          {detailLoadingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL POPUP */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[50px] p-10 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
              <X size={24} />
            </button>
            
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-[32px] flex items-center justify-center mx-auto mb-5 shadow-lg">
                <User size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 uppercase italic leading-none">{selectedUser.name}</h2>
              <p className="text-gray-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2">{selectedUser.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 text-center">
                <Trophy className="text-yellow-500 mx-auto mb-2" size={24} />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ranking</p>
                <h4 className="text-3xl font-black text-gray-800">#{selectedUser.ranking || '0'}</h4>
              </div>
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 text-center">
                <Activity className="text-blue-500 mx-auto mb-2" size={24} />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Aksi</p>
                <h4 className="text-3xl font-black text-gray-800">{selectedUser.total_actions || '0'}</h4>
              </div>
            </div>

            <div className="bg-[#004D40] p-7 rounded-[32px] text-white flex items-center justify-between shadow-xl">
              <div>
                <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Medal Koleksi</p>
                <h4 className="text-xl font-black italic uppercase tracking-tighter">{selectedUser.medal || 'NO MEDAL'}</h4>
              </div>
              <Medal size={45} className={selectedUser.medal ? "text-yellow-400" : "text-white/10"} />
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="w-full mt-8 py-5 bg-gray-900 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  )
}