// src/services/api.js
import axios from 'axios'
import { auth } from '../config/firebase_config'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// ✅ AUTO TOKEN dari Firebase Auth (bukan localStorage)
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser
    if (currentUser) {
      const token = await currentUser.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// USER
export const reportAction  = (data) => api.post('/user/actions', data)
export const getMyActions  = (id)   => api.get(`/user/actions/${id}`)
export const getUserStats  = (id)   => api.get(`/user/stats/${id}`)
export const getUserProfile = (id)  => api.get(`/user/profile/${id}`)

// ADMIN
export const getAdminStats  = ()        => api.get('/admin/stats')
export const getAllActions   = ()        => api.get('/admin/actions')
export const verifyAction   = (id, data) => api.put(`/admin/actions/${id}`, data)
export const getAllUsers     = ()        => api.get('/admin/users')
export const getUserDetail  = (id)      => api.get(`/admin/users/${id}`)
export const getLeaderboard = ()        => api.get('/admin/leaderboard')

export default api