import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import UserSidebar from '../../components/UserSidebar'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import { Send, MapPin, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react'

const BG = 'linear-gradient(180deg, #004D40 0%, #2E7D32 100%)'

export default function UserAksi() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [formData, setFormData] = useState({ action_name: '', description: '', location: '' })

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  const token = localStorage.getItem('token')
  const storedUser = JSON.parse(localStorage.getItem('user'))
  const userId = user?.id || storedUser?.id

  if (!userId) {
    alert("Sesi habis, login ulang!")
    setLoading(false)
    return
  }

  if (!file) {
    alert("Foto wajib diupload!")
    setLoading(false)
    return
  }

  const data = new FormData()
  data.append('user_id', userId)
  data.append('action_name', formData.action_name)
  data.append('description', formData.description || '')
  data.append('location', formData.location || '')
  data.append('image', file)

  try {
    await axios.post('http://127.0.0.1:5000/api/user/actions', data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    alert("✅ Berhasil!")
    navigate('/user/riwayat')
  } catch (err) {
    console.error(err)
    alert("❌ " + (err.response?.data?.message || "Error server"))
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="flex min-h-screen" style={{ background: BG }}>
      <UserSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-[32px] p-8 shadow-2xl mt-10">
          <h1 className="text-3xl font-black text-green-800 mb-6 italic">Kirim Aksi Hijau 🌿</h1>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Nama Aksi</label>
              <input required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-green-400 outline-none transition-all" 
                placeholder="Contoh: Menanam 10 Bibit Mangrove"
                onChange={e => setFormData({...formData, action_name: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Lokasi</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                <input required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 focus:border-green-400 outline-none transition-all" 
                  placeholder="Lokasi Aksi"
                  onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>

            <div onClick={() => fileInputRef.current.click()} className="group border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
              <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
              {preview ? (
                <img src={preview} className="w-full h-48 object-cover rounded-2xl shadow-md" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-green-600">
                  <ImageIcon size={40} />
                  <span className="font-bold text-sm">Klik untuk Upload Foto Aksi</span>
                </div>
              )}
            </div>

            <textarea className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 min-h-[100px] outline-none focus:border-green-400" 
              placeholder="Ceritakan sedikit tentang aksimu..."
              onChange={e => setFormData({...formData, description: e.target.value})} />

            <button disabled={loading} className="w-full bg-green-500 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {loading ? "MENGIRIM KE CLOUDINARY..." : "KIRIM LAPORAN SEKARANG"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}