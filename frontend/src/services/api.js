// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// AUTO TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// AUTH
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// USER
export const reportAction = (data) => api.post('/user/actions', data)
export const getMyActions = (id) => api.get(`/user/actions/${id}`)
export const getUserStats = (id) => api.get(`/user/stats/${id}`)

// ADMIN
export const getAdminStats = () => api.get('/admin/stats')
export const getAllActions = () => api.get('/admin/actions')
export const verifyAction = (id, data) => api.put(`/admin/actions/${id}`, data)
export const getAllUsers = () => api.get('/admin/users')
export const getUserDetail = (id) => api.get(`/admin/users/${id}`)

// LEADERBOARD
export const getLeaderboard = () => api.get('/admin/leaderboard')

export default api