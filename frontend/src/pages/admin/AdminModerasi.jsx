// AdminModerasi.jsx
import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { Bell, Search, Calendar, X, Camera, CheckCircle, Ban } from 'lucide-react'
import { getAllActions, verifyAction } from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

// --- KOMPONEN HEADER SEKSI ---
const SectionHeader = ({ title, type, color, count, searchValue, onSearchChange, dateValue, onDateChange }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-6 rounded-full ${color}`} />
      <h2 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{title}</h2>
      <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-md">{count} DATA</span>
    </div>
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="flex-1 md:w-48 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 focus-within:border-green-400 transition-all shadow-sm">
        <Search size={14} className="text-gray-400" />
        <input
          placeholder="Cari nama..."
          value={searchValue}
          onChange={(e) => onSearchChange(type, e.target.value)}
          className="bg-transparent border-none text-[10px] font-bold focus:outline-none w-full"
        />
      </div>
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
        <Calendar size={14} className="text-gray-400" />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(type, e.target.value)}
          className="bg-transparent border-none text-[10px] font-bold focus:outline-none"
        />
      </div>
    </div>
  </div>
)

// ✅ Komponen foto - tampilkan gambar kalau ada, icon kalau tidak ada
const ActionPhoto = ({ img, actionName, onClick }) => {
  const [imgError, setImgError] = useState(false)
  const imgUrl = img && img !== 'no-image.jpg'
    ? (img.startsWith('http') ? img : `http://localhost:5000${img}`)
    : null

  if (imgUrl && !imgError) {
    return (
      <div
        className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 shadow-sm"
        onClick={onClick}
        title="Klik untuk perbesar"
      >
        <img
          src={imgUrl}
          alt={actionName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
      <Camera size={16} />
    </div>
  )
}

// --- KOMPONEN TABEL ---
const ActionTable = ({ type, isPending, data, searchInputs, onSearchChange, dates, onDateChange, onVerif, onDetail, onPhotoClick }) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-10 overflow-x-auto">
    <SectionHeader
      title={type === 'pending' ? 'Menunggu Verifikasi' : type === 'approved' ? 'Telah Disetujui' : 'Ditolak System'}
      type={type}
      color={type === 'pending' ? 'bg-yellow-400' : type === 'approved' ? 'bg-green-400' : 'bg-red-400'}
      count={data.length}
      searchValue={searchInputs[type]}
      onSearchChange={onSearchChange}
      dateValue={dates[type]}
      onDateChange={onDateChange}
    />
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-50">
          {['User', 'Aksi', 'Kategori', 'Foto', ''].map(h => (
            <th key={h} className="text-left text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] pb-4 px-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((item) => (
          <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
            <td className="py-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-[10px] font-black text-green-700">
                  {item.user_name ? item.user_name.split(' ').map(n => n[0]).join('') : '?'}
                </div>
                <span className="text-sm font-bold text-gray-700">{item.user_name}</span>
              </div>
            </td>
            <td className="py-4 px-2 text-xs text-gray-500 font-medium max-w-[200px] truncate">{item.description}</td>
            <td className="py-4 px-2 italic text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.action_name}</td>

            {/* ✅ FIX: Kolom foto sekarang tampilkan gambar asli */}
            <td className="py-4 px-2">
              <ActionPhoto
                img={item.img}
                actionName={item.action_name}
                onClick={() => onPhotoClick(item)}
              />
            </td>

            <td className="py-4 px-2 text-right">
              <button
                onClick={() => isPending ? onVerif(item) : onDetail(item)}
                className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all ${isPending ? 'bg-green-400 text-white shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                {isPending ? 'Verifikasi' : 'Lihat'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {data.length === 0 && (
      <div className="py-10 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
        Tidak ada data ditemukan
      </div>
    )}
  </div>
)

// --- KOMPONEN UTAMA ---
export default function AdminModerasi() {
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState({ pending: [], approved: [], rejected: [] })
  const [searchInputs, setSearchInputs] = useState({ pending: '', approved: '', rejected: '' })
  const [debouncedFilters, setDebouncedFilters] = useState({ pending: '', approved: '', rejected: '' })
  const [dates, setDates] = useState({ pending: '', approved: '', rejected: '' })
  const [verifModal, setVerifModal] = useState(null)
  const [verifData, setVerifData] = useState({ poin: '', catatan: '', saran: '' })
  const [detailModal, setDetailModal] = useState(null)
  // ✅ State untuk modal foto besar
  const [photoModal, setPhotoModal] = useState(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedFilters(searchInputs) }, 300)
    return () => clearTimeout(handler)
  }, [searchInputs])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getAllActions()
      const data = Array.isArray(res.data) ? res.data : []
      console.log('📌 getAllActions result:', data)
      setActions({
        pending: data.filter(a => a.status === 'pending'),
        approved: data.filter(a => a.status === 'approved'),
        rejected: data.filter(a => a.status === 'rejected'),
      })
    } catch (err) {
      console.error('❌ fetchData error:', err)
      setActions({ pending: [], approved: [], rejected: [] })
    } finally { setLoading(false) }
  }

  const handleVerify = async (id, status) => {
    if (status === 'approved' && !verifData.poin) return alert('Poin wajib diisi untuk persetujuan!')
    if (status === 'rejected' && !verifData.saran) return alert('Saran perbaikan wajib diisi jika ditolak!')
    try {
      await verifyAction(id, {
        status,
        points_earned: status === 'approved' ? Number(verifData.poin) : 0,
        admin_note: verifData.catatan,
        rejection_reason: verifData.saran
      })
      setVerifModal(null)
      setVerifData({ poin: '', catatan: '', saran: '' })
      fetchData()
      alert(`Aksi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
    } catch (err) {
      console.error(err)
      alert('Gagal melakukan verifikasi')
    }
  }

  const getFilteredData = (type) => {
    const typeData = actions[type] || []
    return typeData.filter(item => {
      const matchName = item.user_name?.toLowerCase().includes(debouncedFilters[type].toLowerCase())
      const matchDate = dates[type] ? item.created_at.includes(dates[type]) : true
      return matchName && matchDate
    })
  }

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center px-8 py-7 border-b border-white/10">
          <h1 className="font-black text-3xl text-white tracking-tighter uppercase">Moderasi Konten</h1>
          <div className="flex items-center gap-4 text-white/50 text-sm font-bold">
            <Bell size={22} className="text-white" />
            <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-white font-bold animate-pulse uppercase tracking-[0.3em]">Menghubungkan Server...</div>
          ) : (
            <>
              {['pending', 'approved', 'rejected'].map(type => (
                <ActionTable
                  key={type}
                  type={type}
                  isPending={type === 'pending'}
                  data={getFilteredData(type)}
                  searchInputs={searchInputs}
                  onSearchChange={(t, v) => setSearchInputs(p => ({ ...p, [t]: v }))}
                  dates={dates}
                  onDateChange={(t, v) => setDates(p => ({ ...p, [t]: v }))}
                  onVerif={setVerifModal}
                  onDetail={setDetailModal}
                  onPhotoClick={setPhotoModal}
                />
              ))}
            </>
          )}
        </div>
      </main>

      {/* ✅ MODAL FOTO BESAR */}
      {photoModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPhotoModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPhotoModal(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white font-black text-sm uppercase tracking-widest"
            >
              ✕ Tutup
            </button>
            <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
              {photoModal.img && photoModal.img !== 'no-image.jpg' ? (
                <img
                  src={`http://localhost:5000${photoModal.img}`}
                  alt={photoModal.action_name}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-300 flex-col gap-3">
                  <Camera size={48} />
                  <p className="font-black text-xs uppercase tracking-widest">Tidak ada foto</p>
                </div>
              )}
              <div className="p-6">
                <p className="font-black text-gray-800 uppercase">{photoModal.action_name}</p>
                <p className="text-gray-400 text-xs mt-1">{photoModal.user_name} • {photoModal.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI */}
      {verifModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setVerifModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />

            {/* ✅ Tampilkan foto di modal verifikasi juga */}
            {verifModal.img && verifModal.img !== 'no-image.jpg' && (
              <div className="mb-6 rounded-2xl overflow-hidden max-h-48">
                <img
                  src={`http://localhost:5000${verifModal.img}`}
                  alt={verifModal.action_name}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-2">Verifikasi Aksi</h3>
            <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest italic">
              {verifModal.user_name} • {verifModal.action_name}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Berikan Poin</label>
                <input
                  type="number"
                  placeholder="Contoh: 20"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-black text-green-600 focus:ring-2 focus:ring-green-400 transition-all"
                  value={verifData.poin}
                  onChange={(e) => setVerifData({ ...verifData, poin: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Catatan Admin (Opsional)</label>
                <textarea
                  placeholder="Mantap, pertahankan!"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-xs font-bold focus:ring-2 focus:ring-green-400 min-h-[80px]"
                  value={verifData.catatan}
                  onChange={(e) => setVerifData({ ...verifData, catatan: e.target.value })}
                />
              </div>

              <input
                placeholder="Alasan ditolak (Wajib jika klik Tolak)"
                className="w-full bg-red-50/50 border-none rounded-xl px-4 py-3 text-[10px] font-bold text-red-500 placeholder:text-red-300"
                value={verifData.saran}
                onChange={(e) => setVerifData({ ...verifData, saran: e.target.value })}
              />

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => handleVerify(verifModal.id, 'approved')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  <CheckCircle size={18} /> Setujui
                </button>
                <button
                  onClick={() => {
                    if (!verifData.saran) return alert('Berikan alasan kenapa ditolak!')
                    handleVerify(verifModal.id, 'rejected')
                  }}
                  className="flex-1 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  <Ban size={18} /> Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {detailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDetailModal(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 uppercase">Detail Aksi</h3>
              <X className="cursor-pointer text-gray-400 hover:text-black" onClick={() => setDetailModal(null)} />
            </div>

            {/* ✅ Foto di modal detail juga */}
            {detailModal.img && detailModal.img !== 'no-image.jpg' && (
              <div className="mb-4 rounded-2xl overflow-hidden">
                <img
                  src={`http://localhost:5000${detailModal.img}`}
                  alt={detailModal.action_name}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">User</span>
                  <p className="font-bold text-gray-700">{detailModal.user_name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Status</span>
                  <p className={`font-black uppercase text-xs ${detailModal.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                    {detailModal.status}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Deskripsi Aksi</span>
                <p className="text-gray-600 leading-relaxed">{detailModal.description}</p>
              </div>
              {detailModal.status === 'approved' && (
                <div className="bg-green-50 p-4 rounded-2xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Poin Diberikan</span>
                  <p className="font-black text-green-600">{detailModal.points || 0} poin</p>
                </div>
              )}
              {detailModal.status === 'rejected' && detailModal.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-2xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Alasan Ditolak</span>
                  <p className="text-red-500">{detailModal.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}