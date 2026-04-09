import { useState, useEffect, useRef } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { Plus, X, Calendar, MapPin, Users, CheckCircle, XCircle, Upload, Eye, Bell, ExternalLink, Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

const STATUS_LABEL = {
  roundown: { label: 'Pendaftaran', color: 'bg-yellow-400 text-yellow-900' },
  dilaksanakan: { label: 'Berlangsung', color: 'bg-green-400 text-green-900' },
  berakhir: { label: 'Berakhir', color: 'bg-gray-300 text-gray-700' },
}
const STATUS_MAP = {
  roundown: { label: 'Pendaftaran Dibuka', color: 'bg-yellow-400 text-yellow-900' },
  dilaksanakan: { label: 'Sedang Berlangsung', color: 'bg-green-400 text-green-900' },
  berakhir: { label: 'Telah Berakhir', color: 'bg-gray-300 text-gray-700' },
}

const fmtDT = (d) => !d ? '-' : new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmt = (d) => !d ? '-' : new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// Thumbnail reusable
const EventThumb = ({ event, className = 'w-full h-full' }) => (
  event.thumbnail_type === 'image' && event.thumbnail
    ? <img src={event.thumbnail.startsWith('http') ? event.thumbnail : `http://localhost:5000${event.thumbnail}`} className={`${className} object-cover`} />
    : <div className={`${className} flex items-center justify-center`} style={{ background: event.thumbnail_color || '#22c55e' }}>
      <p className="text-white font-black text-lg text-center px-3">{event.thumbnail_text || event.title}</p>
    </div>
)

export default function AdminEvent() {
  const { user } = useAuth()
  const [allEvents, setAllEvents] = useState([])
  const [myEvents, setMyEvents] = useState({ roundown: [], dilaksanakan: [], berakhir: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('board')  // board | myevent
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(null)
  const [regModal, setRegModal] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [registerModal, setRegisterModal] = useState(null) // daftar event dari board
  const [successData, setSuccessData] = useState(null)
  const [regStatus, setRegStatus] = useState({})   // {eventId: registration}
  const fileInputRef = useRef(null)

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
      console.log('🔍 Admin fetchAll: user.id =', user.id)
      const [allRes, myRes] = await Promise.all([
        api.get('/events'),
        api.get(`/events/host/${user.id}`),
      ])
      console.log('📌 ✅ allRes.data (all events):', allRes.data)
      console.log('📌 ✅ myRes.data (my events):', myRes.data)
      console.log('📌 myEvents structure:', {
        roundown: (myRes.data?.roundown || []).length,
        dilaksanakan: (myRes.data?.dilaksanakan || []).length,
        berakhir: (myRes.data?.berakhir || []).length,
      })
      setAllEvents(allRes.data || [])
      const data = myRes.data || {}
      setMyEvents(data)
    } catch (err) { 
      console.error('❌ Gagal fetch:', err)
      console.error('❌ Error response:', err.response?.data)
    }
    finally { setLoading(false) }
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
      
      const res = await api.post('/events/create', data)
      console.log('✅ Event created:', res.data);
      
      setCreateModal(false)
      setForm({
        title: '', description: '', wa_link: '', location: '', medal_name: 'Medali Sosialisasi',
        thumbnail_type: 'image', thumbnail_text: '', thumbnail_color: '#22c55e',
        registration_start: '', registration_end: '', event_start: '', event_end: ''
      })
      setThumbFile(null); setThumbPreview(null)
      fetchAll()
      alert('✅ Event berhasil dibuat!')
    } catch (err) { 
      console.error('Create error:', err)
      alert(err.response?.data?.message || 'Gagal membuat event')
    }
    finally { setSubmitting(false) }
  }

  // Daftar event dari board (admin ikut event orang lain)
  const handleRegisterEvent = async (event) => {
    if (!window.confirm(`Daftar ke event "${event.title}"?\nKamu akan terdaftar sebagai Member GLI.`)) return
    try {
      const res = await api.post('/events/register', {
        event_id: event.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        is_gli_member: 1,
      })
      setSuccessData(res.data)
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Gagal daftar') }
  }

  const handleVerifyProof = async (registrationId, status) => {
    try {
      await api.post('/events/verify', { registration_id: registrationId, status })
      fetchRegistrations(regModal.id)
      alert(`✅ Bukti ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
    } catch (err) { alert('Gagal verifikasi') }
  }

  const sections = [
    { key: 'roundown', label: 'Roundown / Pendaftaran', color: 'bg-yellow-400' },
    { key: 'dilaksanakan', label: 'Sedang Dilaksanakan', color: 'bg-green-400' },
    { key: 'berakhir', label: 'Berakhir', color: 'bg-gray-400' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-7 border-b border-white/10">
          <div>
            <h1 className="font-black text-3xl text-white tracking-tighter uppercase italic">Event Manager</h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Kelola & Ikuti Event</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-400 text-green-900 font-black text-xs uppercase rounded-2xl hover:bg-green-300 transition">
              <Plus size={16} /> Buat Event
            </button>
            <Bell size={22} className="text-white" />
          </div>
        </div>

        {/* TABS */}
        <div className="px-8 pt-6 flex gap-3">
          {[{ key: 'board', label: 'Board Event' }, { key: 'myevent', label: 'Event Saya' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition ${activeTab === t.key ? 'bg-white text-green-800' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-white font-bold animate-pulse uppercase tracking-widest">Memuat...</div>
          ) : activeTab === 'board' ? (
            // ===== BOARD EVENT =====
            <div>
              {allEvents.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/20">
                  <p className="text-white/30 font-black uppercase tracking-widest text-xs">Belum ada event</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEvents.map(event => {
                    const st = STATUS_MAP[event.status] || STATUS_MAP.roundown
                    const isAdmin = event.host_role === 'admin'
                    const myReg = regStatus[event.id]
                    const isMyEvent = event.host_id === user.id

                    return (
                      <div key={event.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="relative h-44">
                          <EventThumb event={event} />
                          <div className="absolute top-3 left-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isAdmin ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                              {isAdmin ? '👑 Admin' : '🌿 User'}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${st.color}`}>{st.label}</span>
                          </div>
                          {isMyEvent && (
                            <div className="absolute bottom-3 left-3">
                              <span className="text-[9px] font-black px-2 py-1 rounded-full bg-white/90 text-green-700 uppercase">Event Saya</span>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-black text-gray-800 text-base leading-tight mb-1 truncate">{event.title}</h3>
                          <p className="text-gray-400 text-[10px] mb-3 line-clamp-2">{event.description}</p>
                          <div className="space-y-1 mb-4">
                            <div className="flex items-center gap-2 text-gray-400 text-[10px]"><MapPin size={10} />{event.location || 'Online'}</div>
                            <div className="flex items-center gap-2 text-gray-400 text-[10px]"><Calendar size={10} />{fmt(event.event_start)}</div>
                            <div className="flex items-center gap-2 text-gray-400 text-[10px]"><Users size={10} />{event.total_registered} terdaftar</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setDetailModal(event)}
                              className="flex-1 py-2 bg-gray-50 text-gray-600 text-[10px] font-black rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-1">
                              <Eye size={11} /> Detail
                            </button>
                            {!isMyEvent && event.status === 'roundown' && !myReg && (
                              <button onClick={() => handleRegisterEvent(event)}
                                className="flex-1 py-2 bg-green-400 text-green-900 text-[10px] font-black rounded-xl hover:bg-green-300 transition">
                                Daftar
                              </button>
                            )}
                            {!isMyEvent && myReg && (
                              <button onClick={() => setSuccessData({ ...myReg, event_title: event.title, wa_link: event.wa_link, medal_name: event.medal_name, is_gli_member: myReg.is_gli_member })}
                                className="flex-1 py-2 bg-blue-50 text-blue-600 text-[10px] font-black rounded-xl hover:bg-blue-100 transition">
                                ✅ Terdaftar
                              </button>
                            )}
                            {isMyEvent && (
                              <button onClick={() => { setRegModal(event); fetchRegistrations(event.id) }}
                                className="flex-1 py-2 bg-green-50 text-green-700 text-[10px] font-black rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-1">
                                <Users size={11} /> Peserta
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            // ===== EVENT SAYA =====
            sections.map(sec => (
              <div key={sec.key} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2 h-6 rounded-full ${sec.color}`} />
                  <h2 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{sec.label}</h2>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-md">{(myEvents[sec.key] || []).length} EVENT</span>
                </div>
                {(myEvents[sec.key] || []).length === 0 ? (
                  <div className="py-8 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Tidak ada event</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(myEvents[sec.key] || []).map(event => (
                      <div key={event.id} className="border border-gray-100 rounded-[24px] overflow-hidden hover:shadow-md transition">
                        <div className="h-32 relative"><EventThumb event={event} />
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${STATUS_LABEL[event.status]?.color}`}>
                              {STATUS_LABEL[event.status]?.label}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black text-gray-800 text-sm truncate mb-1">{event.title}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] mb-3">
                            <Users size={10} /> {event.total_registered} terdaftar · {event.total_hadir} hadir
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setDetailModal(event)}
                              className="flex-1 py-2 bg-gray-50 text-gray-600 text-[10px] font-black rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-1">
                              <Eye size={11} /> Detail
                            </button>
                            <button onClick={() => { setRegModal(event); fetchRegistrations(event.id) }}
                              className="flex-1 py-2 bg-green-50 text-green-700 text-[10px] font-black rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-1">
                              <Users size={11} /> Peserta
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* ===== MODAL DETAIL ===== */}
      {detailModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-52">
              <EventThumb event={detailModal} />
              <button onClick={() => setDetailModal(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                <X size={14} />
              </button>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${detailModal.host_role === 'admin' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                  {detailModal.host_role === 'admin' ? '👑 Admin' : '🌿 User'} · {detailModal.host_name}
                </span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${STATUS_MAP[detailModal.status]?.color}`}>
                  {STATUS_MAP[detailModal.status]?.label}
                </span>
              </div>
            </div>
            <div className="p-7">
              <h2 className="font-black text-2xl text-gray-800 mb-2">{detailModal.title}</h2>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{detailModal.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  ['Lokasi', detailModal.location || 'Online'],
                  ['Peserta', `${detailModal.total_registered} orang`],
                  ['Mulai', fmtDT(detailModal.event_start)],
                  ['Daftar s/d', fmtDT(detailModal.registration_end)],
                  ['Medali GLI', detailModal.medal_name || 'Medali Sosialisasi'],
                  ['Hadir Terverif.', `${detailModal.total_hadir || 0} orang`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{l}</p>
                    <p className="text-sm font-bold text-gray-700">{v}</p>
                  </div>
                ))}
              </div>
              {detailModal.wa_link && (
                <a href={detailModal.wa_link} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-black text-sm rounded-2xl hover:bg-green-600 transition mb-3">
                  <ExternalLink size={16} /> Bergabung ke Grup WA
                </a>
              )}
              <button onClick={() => setDetailModal(null)}
                className="w-full py-3 bg-gray-100 text-gray-500 font-black text-sm rounded-2xl hover:bg-gray-200 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PESERTA ===== */}
      {regModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setRegModal(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-8 pt-8 pb-4 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-black text-xl text-gray-800 uppercase">Peserta Event</h2>
                <p className="text-gray-400 text-xs font-bold">{regModal.title} · {registrations.length} peserta</p>
              </div>
              <button onClick={() => setRegModal(null)}><X size={20} className="text-gray-300" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-50">
                    {['Nama', 'Email', 'Status GLI', 'Bukti Foto', 'Verifikasi'].map(h => (
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
                          <a href={`http://localhost:5000${reg.proof_img}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl overflow-hidden block border border-gray-200 hover:opacity-80">
                            <img src={`http://localhost:5000${reg.proof_img}`} className="w-full h-full object-cover" />
                          </a>
                        ) : <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300"><Camera size={14} /></div>}
                      </td>
                      <td className="py-3 px-4">
                        {reg.proof_img && reg.proof_status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleVerifyProof(reg.id, 'approved')} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><CheckCircle size={14} /></button>
                            <button onClick={() => handleVerifyProof(reg.id, 'rejected')} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200"><XCircle size={14} /></button>
                          </div>
                        ) : reg.proof_status === 'approved' ? (
                          <span className="text-[9px] font-black text-green-500">✅ Disetujui</span>
                        ) : reg.proof_status === 'rejected' ? (
                          <span className="text-[9px] font-black text-red-400">❌ Ditolak</span>
                        ) : <span className="text-[9px] text-gray-300">Belum Upload</span>}
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

      {/* ===== MODAL BUAT EVENT ===== */}
      {createModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-[40px] px-8 pt-8 pb-4 border-b border-gray-50 z-10">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-2xl text-gray-800 uppercase italic">Buat Event Baru</h2>
                <button onClick={() => setCreateModal(false)} className="text-gray-300 hover:text-gray-600"><X size={22} /></button>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              {/* Judul */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Judul Event *</label>
                <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 ring-green-400"
                  placeholder="Nama event" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              {/* Deskripsi */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Deskripsi</label>
                <textarea className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-green-400 min-h-[100px] resize-none"
                  placeholder="Ceritakan tentang event ini..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)) } }} />
                    {thumbPreview ? <img src={thumbPreview} className="w-full h-32 object-cover rounded-xl" /> :
                      <div className="text-gray-300"><Upload size={32} className="mx-auto mb-2" /><p className="text-xs font-bold">Klik upload gambar</p></div>}
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
              {/* Lokasi & WA */}
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
              {/* Medali */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nama Medali (member GLI)</label>
                <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 ring-green-400"
                  value={form.medal_name} onChange={e => setForm({ ...form, medal_name: e.target.value })} />
              </div>
              {/* Waktu */}
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

      {/* ===== MODAL SUKSES DAFTAR ===== */}
      {successData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="font-black text-2xl text-gray-800 mb-1">
              {successData.registration_id ? 'Berhasil Terdaftar!' : 'Detail Registrasi'}
            </h2>
            <p className="text-gray-400 text-sm mb-1 font-bold">{successData.event_title}</p>
            {successData.is_gli_member ? (
              <div className="bg-green-50 rounded-2xl p-3 mt-3 mb-3 text-xs text-green-700 font-bold">
                🏅 Terdaftar sebagai Member GLI! Upload bukti saat event untuk dapat <strong>{successData.medal_name}</strong>.
              </div>
            ) : (
              <div className="bg-blue-50 rounded-2xl p-3 mt-3 mb-3 text-xs text-blue-600 font-bold">
                👤 Terdaftar sebagai Guest.
              </div>
            )}
            {successData.wa_link && (
              <a href={successData.wa_link} target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-black text-sm rounded-2xl hover:bg-green-600 transition mb-3">
                <ExternalLink size={16} /> Bergabung ke Grup WA
              </a>
            )}
            {!successData.wa_link && (
              <p className="text-gray-400 text-xs mb-4">Link WA akan tersedia saat event mulai.</p>
            )}
            <button onClick={() => setSuccessData(null)}
              className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}