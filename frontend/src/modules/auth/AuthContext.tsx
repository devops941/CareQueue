import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  clinic_id?: string
  is_onboarded?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateUserClinic: (clinicId: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('cq_user')
    const token = localStorage.getItem('cq_token')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('cq_token', access_token)
    localStorage.setItem('cq_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('cq_token')
    localStorage.removeItem('cq_user')
    localStorage.removeItem('cq_onboarded')
    setUser(null)
  }

  const updateUserClinic = (clinicId: string) => {
    if (user) {
      const updated = { ...user, clinic_id: clinicId }
      setUser(updated)
      localStorage.setItem('cq_user', JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading, updateUserClinic }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}