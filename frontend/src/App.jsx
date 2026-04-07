import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage     from './pages/LandingPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminModerasi   from './pages/admin/AdminModerasi'
import AdminMonitoring from './pages/admin/AdminMonitoring'
import AdminProfil     from './pages/admin/AdminProfil'
import AdminEvent      from './pages/admin/AdminEvent'      // ✅ NEW
import UserDashboard   from './pages/user/UserDashboard'
import UserAksi        from './pages/user/UserAksi'
import UserRiwayat     from './pages/user/UserRiwayat'
import UserPeringkat   from './pages/user/UserPeringkat'
import UserProfil      from './pages/user/UserProfil'
import UserEvent       from './pages/user/UserEvent'        // ✅ NEW

function ProtectedRoute({ children, requireAdmin }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/user/dashboard" replace />
  if (!requireAdmin && user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ADMIN ROUTES */}
      <Route path="/admin/dashboard"  element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/moderasi"   element={<ProtectedRoute requireAdmin><AdminModerasi /></ProtectedRoute>} />
      
      {/* UPDATE DI SINI: Path monitoring menggantikan verifikasi */}
      <Route path="/admin/monitoring" element={<ProtectedRoute requireAdmin><AdminMonitoring /></ProtectedRoute>} />
      <Route path="/admin/profil"     element={<ProtectedRoute requireAdmin><AdminProfil /></ProtectedRoute>} />
      <Route path="/admin/event"      element={<ProtectedRoute requireAdmin><AdminEvent /></ProtectedRoute>} />

      {/* USER ROUTES */}
      <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/aksi"      element={<ProtectedRoute><UserAksi /></ProtectedRoute>} />
      <Route path="/user/riwayat"   element={<ProtectedRoute><UserRiwayat /></ProtectedRoute>} />
      <Route path="/user/peringkat" element={<ProtectedRoute><UserPeringkat /></ProtectedRoute>} />
      <Route path="/user/profil"    element={<ProtectedRoute><UserProfil /></ProtectedRoute>} />
      <Route path="/user/event"     element={<ProtectedRoute><UserEvent /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}