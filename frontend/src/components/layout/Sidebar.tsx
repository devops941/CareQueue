import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import {
  LayoutDashboard, BarChart2, Clock, FlaskConical,
  Upload, Users, Settings, ShieldCheck, FileText, LogOut, Stethoscope, Layers,
  CheckCircle2
} from 'lucide-react'

interface NavChild {
  to: string
  icon: any
  label: string
}

interface NavSection {
  label: string | null
  items: NavChild[]
}

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Analytics & Flow',
    items: [
      { to: '/analytics/historical', icon: BarChart2, label: 'Historical' },
      { to: '/analytics/time-slot', icon: Clock, label: 'Time-Slot Heatmap' },
      { to: '/simulation', icon: FlaskConical, label: 'Queue Simulation' },
    ],
  },
  {
    label: 'Patient Data',
    items: [
      { to: '/data/visits', icon: Users, label: 'Visit Records' },
      { to: '/data/import', icon: Upload, label: 'Import Dataset' },
      { to: '/data/quality', icon: CheckCircle2, label: 'Data Quality' },
    ],
  },
  {
    label: 'Reports & Exports',
    items: [
      { to: '/reports', icon: FileText, label: 'Reports & Exports' },
    ],
  },
  {
    label: 'Clinic Settings',
    items: [
      { to: '/settings/clinic', icon: Settings, label: 'Clinic Config' },
      { to: '/settings/specializations', icon: Layers, label: 'Specializations' },
      { to: '/settings/doctors', icon: Stethoscope, label: 'Doctors Roster' },
      { to: '/settings/audit', icon: ShieldCheck, label: 'Audit Logs' },
    ],
  },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group',
          isActive
            ? 'bg-cq-primary text-white shadow-md shadow-sky-500/20 font-semibold'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('cq_token')
    localStorage.removeItem('cq_user')
    navigate('/login')
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-cq-border flex flex-col h-screen select-none shadow-sm z-20">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-cq-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-extrabold text-base">
            CQ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-base tracking-tight">CareQueue</span>
              <span className="px-1.5 py-0.2 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-md">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Clinic Flow Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="px-3 py-3 border-t border-cq-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-cq-danger transition-all group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-cq-danger group-hover:-translate-x-0.5 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
