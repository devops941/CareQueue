import axios from 'axios'

export const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cq_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cq_token')
      localStorage.removeItem('cq_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
