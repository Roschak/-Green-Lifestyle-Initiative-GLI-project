// frontend/src/services/api.js
import axios from 'axios'

// Use localhost for development, Vercel URL for production
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
})

// ✅ Request Interceptor - attach Firebase token
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get Firebase token from the auth context
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const user = auth.currentUser

      if (user) {
        const token = await user.getIdToken(true)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('📤 Firebase token attached to request')
          return config
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not get Firebase token:', err.message)
    }

    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data)

    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token may be expired')
    }
    return Promise.reject(error)
  }
)

// AUTH
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const logout = () => api.post('/auth/logout')

// USER
export const createAction = (data) => api.post('/user/actions', data)
export const getMyActions = (id) => api.get(`/user/actions/${id}`)
export const getUserStats = (id) => api.get(`/user/stats/${id}`)
export const getUserProfile = (id) => api.get(`/user/profile/${id}`)

// ADMIN
export const getDashboardStats = () => api.get('/admin/stats')
export const getAdminStats = () => api.get('/admin/profile/stats')
export const getAllUsers = () => api.get('/admin/users')
export const getUserDetail = (id) => api.get(`/admin/users/${id}`)
export const getAllActions = () => api.get('/admin/actions')
export const verifyAction = (id, data) => api.put(`/admin/actions/${id}`, data)
export const getLeaderboard = () => api.get('/admin/leaderboard')

// EVENTS
export const createEvent = (data) => api.post('/events/create', data)
export const getAllEvents = () => api.get('/events')
export const registerToEvent = (data) => api.post('/events/register', data)
export const uploadProof = (data) => api.post('/events/proof', data)

export default api