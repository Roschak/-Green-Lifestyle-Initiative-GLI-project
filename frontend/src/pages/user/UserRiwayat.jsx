import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserSidebar from '../../components/UserSidebar'
import { Share2, RefreshCcw, X, MapPin, Calendar, Star, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

const statusMap = {
  approved: { label: 'DISETUJUI', color: '#166534', bg: '#dcfce7' },
  pending:  { label: 'TERTUNDA',  color: '#92400e', bg: '#fef3c7' },
  rejected: { label: 'DITOLAK',   color: '#991b1b', bg: '#fee2e2' },
}

const fmt = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function UserRiwayat() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [actions, setActions]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [detailModal, setDetailModal] = useState(null)

  useEffect(() => {
    if (user?.id) fetchActions()
  }, [user])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const token      = localStorage.getItem('token')
      const storedUser = JSON.parse(localStorage.getItem('user'))
      const userId     = user?.id || storedUser?.id
      if (!token) return

      const res = await axios.get(
        `http://localhost:5000/api/user/actions/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setActions(res.data)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Share fungsi — pakai Web Share API kalau ada, fallback copy link
  const handleShare = async (item) => {
    const text = `Saya telah melakukan aksi hijau: "${item.action_name}" di ${item.location || 'Indonesia'}! 🌿 #GreenLifestyle #GLI`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Aksi Hijauku', text })
      } catch (err) {
        // User cancel share, tidak perlu handle
      }
    } else {
      // Fallback: copy ke clipboard
      navigator.clipboard.writeText(text)
      alert('✅ Teks berhasil disalin ke clipboard!')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-black text-3xl text-white">Riwayat Aksi Saya</h1>
          <button onClick={fetchActions} className="text-white/50 hover:text-white transition-all">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white/40 py-20 font-bold tracking-widest animate-pulse uppercase">
            Menghubungkan ke database...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {actions.length > 0 ? actions.map(item => {
              const st = statusMap[item.status] || statusMap.pending
              return (
                <div key={item.id} className="rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-white">
                  <div className="p-5">
                    <span
                      className="text-[10px] font-black px-3 py-1 rounded-full inline-block mb-3 tracking-wider"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>

                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="font-black text-lg text-gray-800 mb-1 leading-tight">
                          {item.action_name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">
                          {fmt(item.created_at)}{item.location ? ` • ${item.location}` : ''}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                            "{item.description}"
                          </p>
                        )}
                        {/* Poin kalau approved */}
                        {item.status === 'approved' && item.points > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            <Star size={10} /> +{item.points} Poin
                          </div>
                        )}
                      </div>

                      {/* Foto */}
                      <div
                        className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => item.img && item.img !== 'no-image.jpg' && setDetailModal(item)}
                      >
                        {item.img && item.img !== 'no-image.jpg'
                          ? <img src={`http://localhost:5000${item.img}`} alt="" className="w-full h-full object-cover" />
                          : <span className="text-2xl">🌿</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-gray-50">
                    {/* ✅ APPROVED */}
                    {item.status === 'approved' && (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setDetailModal(item)}
                          className="flex-1 py-3 bg-green-400 text-green-900 font-black text-xs uppercase tracking-widest rounded-full hover:bg-green-500 transition-all"
                        >
                          Lihat Detail
                        </button>
                        <button
                          onClick={() => handleShare(item)}
                          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                          title="Bagikan"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    )}

                    {/* PENDING */}
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDetailModal(item)}
                          className="flex-1 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-xs font-black uppercase tracking-widest hover:bg-yellow-100 transition-all"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    )}

                    {/* REJECTED */}
                    {item.status === 'rejected' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDetailModal(item)}
                          className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                          Lihat Detail
                        </button>
                        <button
                          onClick={() => navigate('/user/aksi')}
                          className="flex-1 py-3 bg-red-50 text-red-500 border border-red-100 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                          Ajukan Ulang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
              <div className="col-span-2 text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/20 text-white/20">
                <p className="font-black uppercase tracking-[0.3em]">Belum Ada Jejak Hijau</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ✅ MODAL DETAIL AKSI */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Foto besar */}
            <div className="relative">
              {detailModal.img && detailModal.img !== 'no-image.jpg' ? (
                <img
                  src={`http://localhost:5000${detailModal.img}`}
                  alt={detailModal.action_name}
                  className="w-full h-52 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-green-50 flex items-center justify-center text-5xl">
                  🌿
                </div>
              )}

              {/* Badge status di atas foto */}
              <div className="absolute top-3 left-3">
                <span
                  className="text-[10px] font-black px-3 py-1 rounded-full tracking-wider"
                  style={{
                    background: statusMap[detailModal.status]?.bg,
                    color: statusMap[detailModal.status]?.color
                  }}
                >
                  {statusMap[detailModal.status]?.label}
                </span>
              </div>

              {/* Tombol tutup */}
              <button
                onClick={() => setDetailModal(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Konten */}
            <div className="p-6">
              <h2 className="font-black text-xl text-gray-800 mb-1">{detailModal.action_name}</h2>

              <div className="flex flex-wrap gap-3 mb-4">
                {detailModal.location && (
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                    <MapPin size={12} /> {detailModal.location}
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                  <Calendar size={12} /> {fmt(detailModal.created_at)}
                </div>
              </div>

              {detailModal.description && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{detailModal.description}"</p>
                </div>
              )}

              {/* Info tambahan */}
              <div className="space-y-2">
                {/* Poin kalau approved */}
                {detailModal.status === 'approved' && (
                  <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="text-xs font-black uppercase">Poin Didapat</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">+{detailModal.points || 0}</span>
                  </div>
                )}

                {/* Alasan ditolak */}
                {detailModal.status === 'rejected' && (
                  <div className="bg-red-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                      <XCircle size={16} />
                      <span className="text-xs font-black uppercase">Alasan Ditolak</span>
                    </div>
                    <p className="text-xs text-red-400">
                      {detailModal.rejection_reason || 'Tidak memenuhi syarat verifikasi'}
                    </p>
                  </div>
                )}
              </div>

              {/* Tombol aksi di modal */}
              <div className="flex gap-2 mt-5">
                {detailModal.status === 'approved' && (
                  <button
                    onClick={() => handleShare(detailModal)}
                    className="flex-1 py-3 bg-green-400 text-green-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} /> Bagikan
                  </button>
                )}
                {detailModal.status === 'rejected' && (
                  <button
                    onClick={() => { setDetailModal(null); navigate('/user/aksi') }}
                    className="flex-1 py-3 bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-100 transition-all"
                  >
                    Ajukan Ulang
                  </button>
                )}
                <button
                  onClick={() => setDetailModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}