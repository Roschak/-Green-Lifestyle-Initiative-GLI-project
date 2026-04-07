import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { auth, googleProvider, db } from '../config/firebase_config'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ Login dengan Email & Password (LANGSUNG KE FIREBASE)
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi!')
      return
    }

    setError('')
    setLoading(true)
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      console.log('Login sukses:', firebaseUser.email)

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      let userData = { role: 'user', name: firebaseUser.email.split('@')[0] }

      if (userDoc.exists()) {
        userData = userDoc.data()
      }

      const idToken = await firebaseUser.getIdToken()

      if (remember) {
        localStorage.setItem('firebaseToken', idToken)
      }

      const userObj = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData?.name || firebaseUser.email.split('@')[0],
        role: userData?.role || 'user',
        photoURL: firebaseUser.photoURL
      }

      login(userObj, idToken)

      if (userData?.role === 'admin') {
        navigate('/admin/dashboard')
    } else {
        navigate('/user/dashboard')
      }

    } catch (err) {
      console.error('Firebase Login Error:', err.code, err.message)

      if (err.code === 'auth/user-not-found') {
        setError('Email tidak terdaftar!')
      } else if (err.code === 'auth/wrong-password') {
        setError('Password salah!')
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid!')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.')
      } else {
        setError(err.message || 'Login gagal!')
      }
    } finally {
    setLoading(false)
  }
  }

  // ✅ Login dengan Google
  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      console.log('Google Login sukses:', firebaseUser.email)

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      let userData = { role: 'user', name: firebaseUser.displayName }

      if (!userDoc.exists()) {
        const newUserData = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role: 'user',
          provider: 'google',
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString()
        }
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)
        userData = newUserData
    } else {
        userData = userDoc.data()
      }

      const idToken = await firebaseUser.getIdToken()
      localStorage.setItem('firebaseToken', idToken)

      const userObj = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || userData?.name || firebaseUser.email.split('@')[0],
        role: userData?.role || 'user',
        photoURL: firebaseUser.photoURL
      }

      login(userObj, idToken)

      if (userData?.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/user/dashboard')
      }

    } catch (err) {
      console.error('Google Login Error:', err.code, err.message)

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup login ditutup. Silakan coba lagi.')
      } else {
        setError(err.message || 'Gagal login dengan Google!')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden font-poppins">
      <div className="w-5/12 overflow-hidden">
        <img src="/images/pohon.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <img src="/images/pohon.jpg" alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex items-center justify-center h-full p-10">
          {/* ✅ TOMBOL BACK - GLASS EFFECT */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 z-20"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="w-full max-w-md">
            <h1 className="font-black text-4xl text-white text-center mb-2">Welcome Back</h1>
            <p className="text-white/75 text-sm text-center mb-7 leading-relaxed">
              Please enter your credentials to access<br />your account.
            </p>
        
        {error && (
              <div className="bg-red-500/15 border border-red-400/40 rounded-lg p-3 mb-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}
        
          <div className="mb-4">
              <label className="block text-xs font-bold tracking-widest text-white/70 mb-2 uppercase">EMAIL</label>
            <input
                type="text"
              value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gmail.com atau user@gmail.com"
                className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-800 outline-none font-poppins"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
            <div className="mb-4">
              <label className="block text-xs font-bold tracking-widest text-white/70 mb-2 uppercase">PASSWORD</label>
              <div className="relative">
            <input
                  type={showPass ? 'text' : 'password'}
              value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white rounded-xl text-sm text-gray-800 outline-none font-poppins"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer p-0"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
          </div>
          
            <div className="flex justify-between items-center mb-5">
              <span className="text-green-400 text-sm font-semibold cursor-pointer">Forgot Password?</span>
              <div className="flex items-center gap-2">
                <span className="text-white/75 text-sm">Remember sign in details</span>
                <div
                  onClick={() => setRemember(!remember)}
                  className="w-11 h-6 rounded-full cursor-pointer relative transition-colors"
                  style={{ background: remember ? '#4caf50' : 'rgba(255,255,255,0.3)' }}
                >
                  <div
                    className="absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow"
                    style={{ left: remember ? '22px' : '2px' }}
                  />
          </div>
          </div>
        </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 rounded-full text-white font-bold text-base cursor-pointer mb-4 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1B4332' }}
            >
              {loading ? 'Loading...' : 'Log in'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-sm font-semibold">OR</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
              className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer mb-5 flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.26)' }}
        >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
              {loading ? 'Loading...' : 'Continue with Google'}
        </button>
        
            <p className="text-center text-sm text-white/65">
              Don't have an account?{' '}
              <span
                onClick={() => navigate('/register')}
                className="text-green-400 font-bold cursor-pointer hover:text-green-300 transition"
              >
                Register
              </span>
        </p>
          </div>
        </div>
      </div>
    </div>
  )
}