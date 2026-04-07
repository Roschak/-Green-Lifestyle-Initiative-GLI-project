// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { 
  auth, 
  googleProvider,
  db
} from '../config/firebase_config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email)
      
      if (firebaseUser) {
        // Ambil data dari Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        let userData = userDoc.exists() ? userDoc.data() : null
        
        console.log('📄 User data from Firestore:', userData)
        
        // Kalau belum ada di Firestore, buat baru
        if (!userData) {
          userData = {
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            role: 'user',
            points: 0,
            monthly_points: 0,
            level: 'Eco-Newbie',
            status: 'online',
            medal: '',
            medal_period: '',
            last_reset: null,
            created_at: new Date().toISOString()
          }
          await setDoc(doc(db, 'users', firebaseUser.uid), userData)
        } else {
          // Update status online
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            status: 'online',
            lastSeen: serverTimestamp()
          })
        }
        
        setUser({
          uid: firebaseUser.uid,
          ...userData
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Login dengan email/password (pake Firebase Auth)
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login success:', result.user.email)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      let message = 'Login gagal'
      if (error.code === 'auth/invalid-credential') message = 'Email atau password salah'
      if (error.code === 'auth/user-not-found') message = 'Email tidak ditemukan'
      if (error.code === 'auth/wrong-password') message = 'Password salah'
      return { success: false, error: message }
    }
  }

  // Register dengan email/password
  const register = async (name, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Buat user di Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        name: name,
        email: email,
        role: 'user',
        points: 0,
        monthly_points: 0,
        level: 'Eco-Newbie',
        status: 'online',
        medal: '',
        medal_period: '',
        last_reset: null,
        created_at: new Date().toISOString()
      })
      
      console.log('✅ Register success:', email)
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      let message = 'Registrasi gagal'
      if (error.code === 'auth/email-already-in-use') message = 'Email sudah terdaftar'
      if (error.code === 'auth/weak-password') message = 'Password terlalu lemah (minimal 6 karakter)'
      return { success: false, error: message }
    }
  }

  // Login dengan Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      
      // Cek apakah user sudah ada di Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: 'user',
          points: 0,
          monthly_points: 0,
          level: 'Eco-Newbie',
          status: 'online',
          medal: '',
          medal_period: '',
          last_reset: null,
          created_at: new Date().toISOString()
        })
      } else {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          status: 'online',
          lastSeen: serverTimestamp()
        })
      }
      
      console.log('✅ Google login success:', firebaseUser.email)
      return { success: true }
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout
  const logout = async () => {
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'offline'
      }).catch(console.error)
    }
    await signOut(auth)
    console.log('✅ Logout success')
  }

  // Cek apakah user admin
  const isAdmin = () => {
    const isAdminRole = user?.role === 'admin'
    console.log('🔍 isAdmin check:', isAdminRole, 'role:', user?.role)
    return isAdminRole
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)