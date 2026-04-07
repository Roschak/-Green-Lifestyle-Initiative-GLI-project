import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { auth, googleProvider, db } from '../config/firebase_config'
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ Handle register biasa (LANGSUNG KE FIREBASE)
  const handleRegister = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    // Validasi
    if (!form.email || !form.password) {
      setError('Semua field wajib diisi!')
      setLoading(false)
      return
    }

    if (form.password !== form.confirm) {
      setError('Password tidak cocok!')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter!')
      setLoading(false)
      return
    }

    if (!agree) {
      setError('Centang persetujuan terlebih dahulu.')
      setLoading(false)
      return
    }

    try {
      // 1. Buat user di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const firebaseUser = userCredential.user

      // 2. Update profile dengan nama (dari email)
      const name = form.email.split('@')[0]
      await updateProfile(firebaseUser, { displayName: name })

      // 3. Simpan data user ke Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: form.email,
        name: name,
        role: 'user',
        provider: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // 4. Dapatkan token
      const idToken = await firebaseUser.getIdToken()

      // 5. Simpan ke context
      login({
        uid: firebaseUser.uid,
        email: form.email,
        name: name,
        role: 'user'
      }, idToken)

      setSuccess('Registrasi berhasil! Mengalihkan...')
      setTimeout(() => navigate('/user/dashboard'), 1500)

    } catch (err) {
      console.error('Register error:', err.code, err.message)

      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar. Silakan login.')
        setTimeout(() => navigate('/login'), 2000)
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid!')
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah. Gunakan minimal 6 karakter.')
      } else {
        setError(err.message || 'Registrasi gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ Handle register dengan Google
  const handleGoogleRegister = async () => {
    setError('')
    setLoading(true)

    try {
      // Popup Google via Firebase
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Cek apakah user sudah ada di Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

      let role = 'user'
      if (!userDoc.exists()) {
        // User baru, simpan ke Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role: 'user',
          provider: 'google',
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } else {
        role = userDoc.data().role || 'user'
      }

      // Dapatkan token
      const idToken = await firebaseUser.getIdToken()

      // Simpan ke context
      login({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: role,
        photoURL: firebaseUser.photoURL
      }, idToken)

      // Redirect berdasarkan role
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/user/dashboard')
      }

    } catch (err) {
      console.error('Google Register Error:', err.code, err.message)

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login Google dibatalkan.')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup Google diblokir. Izinkan popup untuk melanjutkan.')
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Email sudah terdaftar dengan metode lain. Silakan login.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(err.message || 'Gagal register dengan Google! Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden font-poppins">
      {/* Left Section - Image */}
      <div className="w-5/12 overflow-hidden">
        <img src="/images/pohon.jpg" alt="Background" className="w-full h-full object-cover" />
      </div>

      {/* Right Section - Form */}
      <div className="flex-1 relative overflow-hidden">
        <img src="/images/pohon.jpg" alt="Background Blur" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex items-center justify-center h-full p-10 overflow-y-auto">
          {/* ✅ TOMBOL BACK - GLASS EFFECT */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 z-20"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="w-full max-w-md">
            {/* Header */}
            <h1 className="font-black text-4xl text-white text-center mb-2">Create an account</h1>
            <p className="text-white/75 text-sm text-center mb-7 leading-relaxed">
              Join our community and start your journey today
            </p>

            {/* Error & Success Messages */}
            {error && (
              <div className="bg-red-500/15 border border-red-400/40 rounded-lg p-3 mb-4 text-red-300 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/15 border border-green-400/40 rounded-lg p-3 mb-4 text-green-300 text-sm text-center">
                {success}
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-xs font-bold tracking-widest text-white/70 mb-2 uppercase">
                EMAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@gmail.com"
                className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-800 outline-none font-poppins focus:ring-2 focus:ring-green-500 transition-all"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-xs font-bold tracking-widest text-white/70 mb-2 uppercase">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white rounded-xl text-sm text-gray-800 outline-none font-poppins focus:ring-2 focus:ring-green-500 transition-all"
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                  disabled={loading}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-5">
              <label className="block text-xs font-bold tracking-widest text-white/70 mb-2 uppercase">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white rounded-xl text-sm text-gray-800 outline-none font-poppins focus:ring-2 focus:ring-green-500 transition-all"
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                <button
                  onClick={() => setShowConf(!showConf)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                  disabled={loading}
                >
                  {showConf ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center gap-3 mb-5">
              <div
                onClick={() => !loading && setAgree(!agree)}
                className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${agree ? 'bg-green-500 border-green-500' : 'border-2 border-white/50 hover:border-white/80'
                  }`}
              >
                {agree && <span className="text-white text-xs font-black">✓</span>}
              </div>
              <span className="text-white/80 text-sm">
                I agree to the{' '}
                <span className="text-green-400 cursor-pointer font-semibold hover:underline">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-green-400 cursor-pointer font-semibold hover:underline">
                  Privacy Policy
                </span>
              </span>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={loading || !agree || !form.email || !form.password || !form.confirm}
              className="w-full py-4 rounded-full text-white font-bold text-base cursor-pointer mb-4 transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: '#1B4332' }}
            >
              {loading ? 'Processing...' : 'Create account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm font-semibold">OR</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Google Register Button */}
            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer mb-5 flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50 group"
              style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.26)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? 'Processing...' : 'Sign up with Google'}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-white/65">
              Already have an account?{' '}
              <span
                onClick={() => navigate('/login')}
                className="text-green-400 font-bold cursor-pointer hover:underline transition-all"
              >
                Log in
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}