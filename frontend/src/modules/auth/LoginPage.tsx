import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Eye, EyeOff, ShieldCheck, Stethoscope, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@gmail.com')
  const [password, setPassword] = useState('Admin@123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
      const isOnboarded = user.is_onboarded === true || localStorage.getItem('cq_onboarded') === 'true'
      navigate(isOnboarded ? '/dashboard' : '/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillCredentials = (type: 'admin' | 'doctor') => {
    if (type === 'admin') {
      setEmail('admin@gmail.com')
      setPassword('Admin@123')
    } else {
      setEmail('doctor@clinic.in')
      setPassword('Admin@123')
    }
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2fe]/60 via-[#f0f9ff]/80 to-[#f1f5f9] flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* ========================================================
          CARD CONTAINER (Exact dimensions & floating shadow)
          ======================================================== */}
      <div className="w-full max-w-[840px] bg-white rounded-3xl shadow-2xl shadow-sky-900/10 overflow-hidden relative min-h-[480px] flex flex-col md:flex-row border border-sky-100">

        {/* ========================================================
            RIGHT POLYGONAL CRYSTAL BANNER (CareQueue Brand Theme)
            Uses clean non-overlapping polygon cut in Medical Sky Blue & Oceanic Sapphire
            ======================================================== */}
        <div
          className="hidden md:block absolute right-0 top-0 bottom-0 w-full pointer-events-none z-10"
          style={{
            clipPath: 'polygon(36% 0%, 100% 0%, 100% 100%, 86% 100%)',
          }}
        >
          {/* Base CareQueue Oceanic & Sky Blue Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0f172a]" />

          {/* SVG 3D Crystal Triangles Facets */}
          <svg
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-55"
            viewBox="0 0 840 480"
            preserveAspectRatio="none"
          >
            <polygon points="300,0 520,100 420,260" fill="#ffffff" opacity="0.35" />
            <polygon points="520,100 840,0 680,180" fill="#000000" opacity="0.25" />
            <polygon points="420,260 520,100 680,180" fill="#ffffff" opacity="0.25" />
            <polygon points="420,260 680,180 600,360" fill="#000000" opacity="0.2" />
            <polygon points="300,0 420,260 350,480" fill="#000000" opacity="0.25" />
            <polygon points="420,260 600,360 350,480" fill="#ffffff" opacity="0.3" />
            <polygon points="600,360 840,480 350,480" fill="#000000" opacity="0.35" />
            <polygon points="680,180 840,0 840,280" fill="#ffffff" opacity="0.3" />
            <polygon points="680,180 840,280 600,360" fill="#000000" opacity="0.25" />
            <polygon points="600,360 840,280 840,480" fill="#ffffff" opacity="0.35" />
          </svg>

          {/* "Welcome Back." Text Content (Anchored safely inside the wide top-right) */}
          <div className="absolute top-14 right-10 lg:right-14 max-w-[280px] text-right select-none">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Welcome<br />
              <span className="text-sky-200">Back.</span>
            </h2>
            <p className="text-[11px] text-sky-100 font-medium mt-4 leading-relaxed opacity-95 drop-shadow-xs text-right">
              CareQueue Operations Intelligence — Predict patient wait times, eliminate clinic bottlenecks, and simulate hospital service flow with SimPy discrete-event modeling.
            </p>
          </div>
        </div>

        {/* ========================================================
            MOBILE CAREQUEUE BANNER (Visible ONLY on small mobile screens)
            ======================================================== */}
        <div className="md:hidden bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0f172a] p-6 text-white text-center">
          <h2 className="text-2xl font-black">Welcome Back.</h2>
          <p className="text-xs text-sky-100 mt-1">CareQueue Operations Intelligence</p>
        </div>

        {/* ========================================================
            LEFT COLUMN: White Login Form (Styled in CareQueue Brand Palette)
            ======================================================== */}
        <div className="w-full md:w-[65%] p-8 sm:p-12 z-20 flex flex-col justify-between bg-transparent">
          <div className="max-w-[320px]">
            {/* Title & Subtitle */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-sky-500/20">
                  CQ
                </div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  CareQueue Platform
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Login
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Access your clinic operations & patient queue intelligence
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. admin@gmail.com"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#0f172a] placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all shadow-2xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3.5 py-2 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Remember Me Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 text-[11px] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#0284c7] border-slate-300 cursor-pointer accent-[#0284c7]"
                  />
                  <span>Remember Me</span>
                </label>
                <span className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold cursor-pointer">
                  Default: Admin@123
                </span>
              </div>

              {/* CareQueue Brand Blue Pill LOGIN Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
                </button>
              </div>
            </form>
          </div>

          {/* Social / One-Click Test Login Pills (Bottom Left) */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demo Autofill:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                title="Fill Super Admin Credentials"
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 border border-sky-200 transition-transform hover:scale-105 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('doctor')}
                title="Fill Clinic Doctor Credentials"
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 transition-transform hover:scale-105 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doctor</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
