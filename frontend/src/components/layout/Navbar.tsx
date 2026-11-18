import { Building2, ChevronDown, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/modules/auth/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, updateUserClinic } = useAuth()
  const navigate = useNavigate()
  const [clinicDropdownOpen, setClinicDropdownOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const clinicRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Fetch clinics list for switching
  const { data: clinics = [] } = useQuery({
    queryKey: ['navbar-clinics'],
    queryFn: async () => {
      try {
        if (user?.role === 'super_admin') {
          return (await apiClient.get('/clinics')).data
        } else if (user?.clinic_id) {
          const res = await apiClient.get(`/clinics/${user.clinic_id}`)
          return [res.data]
        }
      } catch {
        return []
      }
      return []
    },
    enabled: !!user,
  })

  // Auto-select first clinic if user has no clinic_id
  useEffect(() => {
    if (user && !user.clinic_id && clinics.length > 0) {
      updateUserClinic(clinics[0].id)
    }
  }, [clinics, user])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (clinicRef.current && !clinicRef.current.contains(target)) {
        setClinicDropdownOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentClinic = clinics.find((c: any) => c.id === user?.clinic_id)

  const handleLogout = () => {
    localStorage.removeItem('cq_token')
    localStorage.removeItem('cq_user')
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 select-none">
      {/* Left: Clean Active Clinic Name */}
      <div className="relative" ref={clinicRef}>
        <button
          onClick={() => clinics.length > 1 && setClinicDropdownOpen(!clinicDropdownOpen)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
            clinics.length > 1
              ? 'border-slate-200 hover:border-sky-400 hover:bg-slate-50 cursor-pointer shadow-2xs'
              : 'border-transparent bg-slate-50 cursor-default'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Active Clinic
            </span>
            <span className="font-bold text-slate-800 text-sm block leading-tight mt-0.5">
              {currentClinic?.name || (user?.clinic_id ? 'City General Clinic' : 'CareQueue Clinic')}
            </span>
          </div>
          {clinics.length > 1 && (
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform ${clinicDropdownOpen ? 'rotate-180 text-sky-600' : ''}`} />
          )}
        </button>

        {/* Clinic Switching Dropdown */}
        {clinicDropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5">
            <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Clinics
            </p>
            {clinics.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  updateUserClinic(c.id)
                  setClinicDropdownOpen(false)
                  toast.success(`Switched to ${c.name}`)
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  c.id === user?.clinic_id ? 'bg-sky-50 text-sky-800 font-bold' : 'text-slate-700'
                }`}
              >
                <span>{c.name}</span>
                {c.id === user?.clinic_id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Clean User Profile Badge & Logout */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {(user?.full_name || 'A')[0].toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.full_name || 'Super Admin'}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {user?.role ? user.role.replace('_', ' ') : 'super admin'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>

        {/* Profile Dropdown */}
        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">{user?.full_name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@gmail.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
