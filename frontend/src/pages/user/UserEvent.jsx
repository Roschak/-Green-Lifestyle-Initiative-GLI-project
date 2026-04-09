// src/pages/user/UserEvent.jsx
import { useState, useEffect, useRef } from 'react'
import UserSidebar from '../../components/UserSidebar'
import { Plus, X, Calendar, MapPin, Users, Upload, Eye, CheckCircle, XCircle, Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

const STATUS_LABEL = {
  roundown: { label: 'Pendaftaran', color: 'bg-yellow-400 text-yellow-900' },
  dilaksanakan: { label: 'Berlangsung', color: 'bg-green-400 text-green-900' },
  berakhir: { label: 'Berakhir', color: 'bg-gray-300 text-gray-700' },
}

const PROOF_STATUS = {
  pending: { label: 'Menunggu Verifikasi', color: 'text-yellow-500' },
  approved: { label: 'Disetujui ✅', color: 'text-green-500' },
  rejected: { label: 'Ditolak ❌', color: 'text-red-500' },
}

const formatDateTime = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function UserEvent() {
  const { user } = useAuth()
  const [myEvents, setMyEvents] = useState({ roundown: [], dilaksanakan: [], berakhir: [] })
  const [myRegs, setMyRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('event') // 'event' | 'ikuti'
  const [createModal, setCreateModal] = useState(false)
  const [regModal, setRegModal] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [proofModal, setProofModal] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const fileInputRef = useRef(null)
  const proofInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '', description: '', wa_link: '', location: '', medal_name: 'Medali Sosialisasi',
    thumbnail_type: 'image', thumbnail_text: '', thumbnail_color: '#22c55e',
    registration_start: '', registration_end: '', event_start: '', event_end: ''
  })
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      console.log('🔍 User fetchAll: user.id =', user.id)
      const [evRes, regRes] = await Promise.all([
        api.get(`/events/host/${user.id}`),
        api.get(`/events/my/${user.id}`),
      ])
      console.log('📌 ✅ evRes.data (my events):', evRes.data)
      console.log('📌 ✅ regRes.data (my registrations):', regRes.data)
      console.log('📌 myEvents structure:', {
        roundown: (evRes.data?.roundown || []).length,
        dilaksanakan: (evRes.data?.dilaksanakan || []).length,
        berakhir: (evRes.data?.berakhir || []).length,
      })
      const data = evRes.data || {}
      setMyEvents(data)
      setMyRegs(regRes.data || [])
    } catch (err) {
      console.error('❌ Gagal fetch:', err)
      console.error('❌ Error response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/registrations`)
      setRegistrations(res.data || [])
    } catch (err) { console.error(err) }
  }

  const handleCreate = async () => {
    if (!form.title || !form.registration_start || !form.registration_end || !form.event_start || !form.event_end)
      return alert('Judul dan semua waktu wajib diisi!')
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (thumbFile) data.append('thumbnail', thumbFile)

      await api.post('/events/create', data)
      setCreateModal(false)
      setForm({ title: '', description: '', wa_link: '', location: '', medal_name: 'Medali Sosialisasi', thumbnail_type: 'image', thumbnail_text: '', thumbnail_color: '#22c55e', registration_start: '', registration_end: '', event_start: '', event_end: '' })
      setThumbFile(null)
      setThumbPreview(null)
      fetchAll()
      alert('✅ Event berhasil dibuat!')
    } catch (err) {
      console.error('Create error:', err)
      alert(err.response?.data?.message || 'Gagal membuat event')
    } finally { setSubmitting(false) }
  }

  const handleUploadProof = async () => {
    if (!proofFile) return alert('Pilih foto dulu!')
    try {
      const data = new FormData()
      data.append('registration_id', proofModal.id)
      data.append('proof', proofFile)
      await api.post('/events/proof', data)
      setProofModal(null); setProofFile(null); setProofPreview(null)
      fetchAll()
      alert('✅ Bukti foto berhasil diupload!')
    } catch (err) {
      console.error('Upload proof error:', err)
      alert('Gagal upload')
    }
  }

  const handleVerifyProof = async (registrationId, status) => {
    try {
      await api.post('/events/verify', { registration_id: registrationId, status })
      fetchRegistrations(regModal.id)
    } catch (err) { alert('Gagal verifikasi') }
  }

  const sections = [
    { key: 'roundown', label: 'Roundown / Pendaftaran', color: 'bg-yellow-400' },
    { key: 'dilaksanakan', label: 'Sedang Dilaksanakan', color: 'bg-green-400' },
    { key: 'berakhir', label: 'Berakhir', color: 'bg-gray-400' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-7 border-b border-white/10">
          <div>
            <h1 className="font-black text-3xl text-white tracking-tighter uppercase italic">Event</h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Buat & Ikuti Event</p>
          </div>
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-400 text-green-900 font-black text-xs uppercase rounded-2xl hover:bg-green-300 transition">
            <Plus size={16} /> Buat Event
          </button>
        </div>

        {/* TAB */}
        <div className="px-8 pt-6 flex gap-3">
          {[{ key: 'event', label: 'Event Saya' }, { key: 'ikuti', label: 'Event Diikuti' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition ${activeTab === t.key ? 'bg-white text-green-800' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-white font-bold animate-pulse uppercase tracking-widest">Memuat...</div>
          ) : activeTab === 'event' ? (
            // ===== TAB EVENT SAYA =====
            sections.map(sec => (
              <div key={sec.key} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-6 rounded-full ${sec.color}`} />
                  <h2 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{sec.label}</h2>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-md">
                    {(myEvents[sec.key] || []).length} EVENT
                  </span>
                </div>

                {(myEvents[sec.key] || []).length === 0 ? (
                  <div className="py-8 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Tidak ada event</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(myEvents[sec.key] || []).map(event => (
                      <div key={event.id} className="border border-gray-100 rounded-[24px] overflow-hidden hover:shadow-md transition">
                        <div className="h-32 relative">
                          {event.thumbnail_type === 'image' && event.thumbnail ? (
                            <img src={event.thumbnail.startsWith('http') ? event.thumbnail : `http://localhost:5000${event.thumbnail}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: event.thumbnail_color }}>
                              <p className="text-white font-black text-lg text-center px-3">{event.thumbnail_text || event.title}</p>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${STATUS_LABEL[event.status]?.color}`}>
                              {STATUS_LABEL[event.status]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black text-gray-800 text-sm truncate mb-1">{event.title}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] mb-3">
                            <Users size={10} /> {event.total_registered} terdaftar
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setRegModal(event); fetchRegistrations(event.id) }}
                              className="flex-1 py-2 bg-green-50 text-green-700 text-[10px] font-black rounded-xl hover:bg-green-100 transition">
                              Lihat Peserta
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            // ===== TAB EVENT DIIKUTI =====
            <div className="space-y-4">
              {myRegs.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-[32px] border border-dashed border-white/20">
                  <p className="text-white/30 font-black uppercase tracking-widest text-xs">Belum mengikuti event</p>
                </div>
              ) : myRegs.map(reg => {
                const st = STATUS_LABEL[reg.event_status] || STATUS_LABEL.roundown
                const ps = PROOF_STATUS[reg.proof_status] || PROOF_STATUS.pending
                return (
                  <div key={reg.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 flex gap-5 items-start">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden">
                      {reg.thumbnail_type === 'image' && reg.thumbnail ? (
                        <img src={`http://localhost:5000${reg.thumbnail}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: reg.thumbnail_color }}>
                          <p className="text-white font-black text-xs text-center px-1">{reg.thumbnail_text || reg.title}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-black text-gray-800 text-sm truncate">{reg.title}</h3>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase flex-shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                          <Calendar size={10} /> {formatDateTime(reg.event_start)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                          <MapPin size={10} /> {reg.location || 'Online'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Link WA saat dilaksanakan */}
                        {reg.event_status === 'dilaksanakan' && reg.wa_link && (
                          <a href={reg.wa_link} target="_blank" rel="noreferrer"
                            className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl hover:bg-green-600 transition">
                            🟢 Grup WA
                          </a>
                        )}

                        {/* Upload bukti saat dilaksanakan */}
                        {reg.event_status === 'dilaksanakan' && !reg.proof_img && (
                          <button onClick={() => setProofModal(reg)}
                            className="px-3 py-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-xl hover:bg-yellow-300 transition flex items-center gap-1">
                            <Camera size={11} /> Upload Bukti
                          </button>
                        )}

                        {/* Status bukti */}
                        {reg.proof_img && (
                          <span className={`text-[10px] font-black ${ps.color}`}>{ps.label}</span>
                        )}

                        {/* Medali kalau sudah dapat */}
                        {reg.medal_awarded === 1 && (
                          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-xl">
                            🏅 {reg.medal_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL BUAT EVENT */}
      {createModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-[40px] px-8 pt-8 pb-4 border-b border-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-2xl text-gray-800 uppercase italic">Buat Event</h2>
                <button onClick={() => setCreateModal(false)} className="text-gray-300 hover:text-gray-600"><X size={22} /></button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Judul Event *</label>
                <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 ring-green-400"
                  placeholder="Nama event kamu"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Deskripsi</label>
                <textarea className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-green-400 min-h-[100px] resize-none"
                  placeholder="Ceritakan tentang event ini..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Thumbnail</label>
                <div className="flex gap-3 mb-3">
                  {['image', 'text'].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, thumbnail_type: t })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${form.thumbnail_type === t ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {t === 'image' ? '🖼️ Gambar' : '✏️ Teks'}
                    </button>
                  ))}
                </div>
                {form.thumbnail_type === 'image' ? (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-green-400 transition">
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={e => {
                      const f = e.target.files[0]; if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)) }
                    }} />
                    {thumbPreview ? <img src={thumbPreview} className="w-full h-32 object-cover rounded-xl" /> : (
                      <div className="text-gray-300"><Upload size={28} className="mx-auto mb-2" /><p className="text-xs font-bold">Klik upload gambar</p></div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 ring-green-400"
                      placeholder="Teks thumbnail" value={form.thumbnail_text} onChange={e => setForm({ ...form, thumbnail_text: e.target.value })} />
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Warna:</label>
                      <input type="color" value={form.thumbnail_color} onChange={e => setForm({ ...form, thumbnail_color: e.target.value })} className="w-10 h-10 rounded-xl cursor-pointer" />
                      <div className="flex-1 rounded-xl py-3 flex items-center justify-center font-black text-white text-sm" style={{ background: form.thumbnail_color }}>
                        {form.thumbnail_text || form.title || 'Preview'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Lokasi</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-green-400"
                    placeholder="Lokasi / Online" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Link Grup WA</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-green-400"
                    placeholder="https://chat.whatsapp.com/..." value={form.wa_link} onChange={e => setForm({ ...form, wa_link: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nama Medali (untuk member GLI)</label>
                <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 ring-green-400"
                  value={form.medal_name} onChange={e => setForm({ ...form, medal_name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[['registration_start', 'Mulai Pendaftaran *'], ['registration_end', 'Tutup Pendaftaran *'], ['event_start', 'Mulai Pelaksanaan *'], ['event_end', 'Selesai Pelaksanaan *']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">{label}</label>
                    <input type="datetime-local" className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-green-400"
                      value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button onClick={handleCreate} disabled={submitting}
                className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition disabled:opacity-50 uppercase text-sm">
                {submitting ? 'Membuat...' : '✅ Buat Event'}
              </button>
              <button onClick={() => setCreateModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PESERTA (HOST) */}
      {regModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setRegModal(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-8 pt-8 pb-4 border-b border-gray-50 flex justify-between">
              <div>
                <h2 className="font-black text-xl text-gray-800">Peserta</h2>
                <p className="text-gray-400 text-xs font-bold">{regModal.title} · {registrations.length} peserta</p>
              </div>
              <button onClick={() => setRegModal(null)}><X size={20} className="text-gray-300" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-50">
                    {['Nama', 'Email', 'Status GLI', 'Bukti', 'Aksi'].map(h => (
                      <th key={h} className="text-left text-[9px] font-black text-gray-300 uppercase tracking-widest py-4 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registrations.map(reg => (
                    <tr key={reg.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-sm font-bold text-gray-700">{reg.name}</td>
                      <td className="py-3 px-4 text-xs text-gray-400">{reg.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${reg.is_gli_member ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {reg.is_gli_member ? '✅ Member' : '👤 Guest'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {reg.proof_img ? (
                          <a href={`http://localhost:5000${reg.proof_img}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl overflow-hidden block border">
                            <img src={`http://localhost:5000${reg.proof_img}`} className="w-full h-full object-cover" />
                          </a>
                        ) : <span className="text-gray-300 text-[10px]">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        {reg.proof_img && reg.proof_status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleVerifyProof(reg.id, 'approved')} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => handleVerifyProof(reg.id, 'rejected')} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200">
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : reg.proof_status === 'approved' ? (
                          <span className="text-[9px] font-black text-green-500">✅ OK</span>
                        ) : reg.proof_status === 'rejected' ? (
                          <span className="text-[9px] font-black text-red-400">❌ Tolak</span>
                        ) : <span className="text-[9px] text-gray-300">Belum</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {registrations.length === 0 && <div className="py-10 text-center text-gray-300 font-black uppercase text-xs">Belum ada peserta</div>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD BUKTI */}
      {proofModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setProofModal(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-xl text-gray-800">Upload Bukti</h2>
              <button onClick={() => setProofModal(null)}><X size={20} className="text-gray-300" /></button>
            </div>
            <p className="text-gray-400 text-xs mb-5 font-bold">{proofModal.title}</p>
            <div onClick={() => proofInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 transition mb-5">
              <input type="file" hidden ref={proofInputRef} accept="image/*" onChange={e => {
                const f = e.target.files[0]; if (f) { setProofFile(f); setProofPreview(URL.createObjectURL(f)) }
              }} />
              {proofPreview ? <img src={proofPreview} className="w-full h-40 object-cover rounded-xl" /> : (
                <div className="text-gray-300"><Camera size={32} className="mx-auto mb-2" /><p className="text-xs font-bold">Klik upload foto bukti</p></div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleUploadProof} className="flex-1 py-3 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition">Upload</button>
              <button onClick={() => setProofModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-black rounded-2xl">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}