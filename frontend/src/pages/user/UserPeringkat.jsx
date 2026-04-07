import { useState, useEffect } from 'react'
import UserSidebar from '../../components/UserSidebar'
import { useAuth } from '../../context/AuthContext'
import { getLeaderboard } from '../../services/api'
import { Trophy, Medal, Star, User as UserIcon } from 'lucide-react'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'
const medals = ['🥇', '🥈', '🥉']

const getInitials = (name) => 
  name ? name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '??'

export default function UserPeringkat() {
  const { user: currentUser } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [period, setPeriod] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await getLeaderboard()
      // Ambil data dari res.data.data karena backend kita kirim { period, data }
      const apiData = res.data?.data || []
      setPeriod(res.data?.period || 'Season Baru')

      const mapped = apiData.map((u, i) => ({
        id: u.id,
        rank: i + 1,
        name: u.name,
        initials: getInitials(u.name),
        aksi: u.total_actions || 0,
        poin: u.points || 0,
        isMe: u.id === currentUser?.id
      }))

      setLeaderboard(mapped)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-black text-4xl text-white tracking-tighter uppercase italic">Leaderboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-3 py-1 bg-yellow-400 rounded-full text-[10px] font-black uppercase text-green-900">
                Active Season
              </div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{period}</p>
            </div>
          </div>
          <Trophy size={48} className="text-white/20 -rotate-12" />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl w-full" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          /* EMPTY STATE YANG TETAP KEREN */
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="text-green-400" size={40} />
            </div>
            <h2 className="text-white font-black text-xl uppercase italic">Belum ada kompetisi</h2>
            <p className="text-white/40 text-sm max-w-xs mx-auto mt-2">
              Jadilah orang pertama yang melakukan aksi lingkungan bulan ini dan raih medali emas!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leaderboard.map((item) => {
              const isTop3 = item.rank <= 3
              
              return (
                <div 
                  key={item.id}
                  className={`relative flex items-center justify-between p-5 rounded-[28px] transition-all border ${
                    item.isMe ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-white/5'
                  }`}
                  style={{ 
                    background: isTop3 
                      ? 'rgba(255, 255, 255, 0.95)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    backdropBlur: '10px'
                  }}
                >
                  {/* RANK INDICATOR */}
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl ${
                      isTop3 ? 'bg-green-100 text-green-800' : 'text-white/20'
                    }`}>
                      {isTop3 ? medals[item.rank - 1] : `#${item.rank}`}
                    </div>

                    {/* USER INFO */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black uppercase italic tracking-tight ${isTop3 ? 'text-green-900' : 'text-white'}`}>
                          {item.name}
                        </span>
                        {item.isMe && (
                          <span className="bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black">YOU</span>
                        )}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${isTop3 ? 'text-green-700/60' : 'text-white/30'}`}>
                        {item.aksi} Aksi Tervalidasi
                      </div>
                    </div>
                  </div>

                  {/* POINTS */}
                  <div className="text-right">
                    <div className={`text-2xl font-black italic ${isTop3 ? 'text-green-800' : 'text-green-400'}`}>
                      {item.poin.toLocaleString()}
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-[0.2em] ${isTop3 ? 'text-green-900/40' : 'text-white/20'}`}>
                      Green Points
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}