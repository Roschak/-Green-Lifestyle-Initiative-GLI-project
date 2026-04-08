// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider, db } from '../config/firebase_config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

          if (userDoc.exists()) {
            const data = userDoc.data()
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              status: 'online',
              lastSeen: serverTimestamp()
            })
            // ✅ id = uid agar konsisten di seluruh app
            setUser({
              uid:   firebaseUser.uid,
              id:    firebaseUser.uid,
              email: firebaseUser.email,
              name:  data.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role:  data.role || 'user',
              ...data
            })
          } else {
            // User baru → buat di Firestore
            const newUser = {
              name:           firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email:          firebaseUser.email,
              role:           'user',
              points:         0,
              monthly_points: 0,
              level:          'Eco-Newbie',
              status:         'online',
              medal:          '',
              last_reset:     null,
              created_at:     new Date().toISOString()
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
            setUser({ uid: firebaseUser.uid, id: firebaseUser.uid, ...newUser })
          }
        } catch (err) {
          console.error('Error loading user:', err)
          setUser({
            uid:   firebaseUser.uid,
            id:    firebaseUser.uid,
            email: firebaseUser.email,
            role:  'user'
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // ── LOGIN EMAIL/PASSWORD ──────────────────────────────────────────────────
  const login = async (email, password) => {
    // Support legacy call dengan object
    if (typeof email === 'object') return
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (err) {
      let message = 'Login gagal'
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') message = 'Email atau password salah'
      if (err.code === 'auth/user-not-found')   message = 'Email tidak ditemukan'
      if (err.code === 'auth/too-many-requests') message = 'Terlalu banyak percobaan'
      return { success: false, error: message }
    }
  }

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      await setDoc(doc(db, 'users', result.user.uid), {
        name, email,
        role:           'user',
        points:         0,
        monthly_points: 0,
        level:          'Eco-Newbie',
        status:         'online',
        medal:          '',
        last_reset:     null,
        created_at:     new Date().toISOString()
      })
      return { success: true }
    } catch (err) {
      let message = 'Registrasi gagal'
      if (err.code === 'auth/email-already-in-use') message = 'Email sudah terdaftar'
      if (err.code === 'auth/weak-password')         message = 'Password minimal 6 karakter'
      return { success: false, error: message }
    }
  }

  // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      const result       = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      const userDoc      = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name:           firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email:          firebaseUser.email,
          role:           'user',
          points:         0,
          monthly_points: 0,
          level:          'Eco-Newbie',
          status:         'online',
          medal:          '',
          last_reset:     null,
          created_at:     new Date().toISOString()
        })
      }
      return { success: true }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return { success: false, error: 'Popup ditutup' }
      return { success: false, error: err.message }
    }
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), { status: 'offline' }).catch(console.error)
    }
    await signOut(auth)
  }

  // ── GET TOKEN untuk request ke backend Express ────────────────────────────
  const getToken = async () => {
    const current = auth.currentUser
    if (!current) return null
    return await current.getIdToken()
  }

  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, isAdmin, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)