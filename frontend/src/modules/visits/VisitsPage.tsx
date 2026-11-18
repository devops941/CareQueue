import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Search, Filter, Download, Sparkles, User, Clock,
  Calendar, ArrowRight, ChevronRight, X, CheckCircle2, AlertCircle, Plus,
  Trash2, UserCheck, Stethoscope, LogOut, UploadCloud, FileText
} from 'lucide-react'

export default function VisitsPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [newVisit, setNewVisit] = useState({
    patient_token: '',
    visit_type: 'walk_in',
    department_id: '',
    doctor_id: '',
    notes: '',
  })

  // Fetch departments/specializations
  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/departments`)).data,
    enabled: !!clinicId,
  })

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/doctors`)).data,
    enabled: !!clinicId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['visits', clinicId, page],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/visits?page=${page}&page_size=50`)).data,
    enabled: !!clinicId,
  })

  const createVisitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const now = new Date()
      const deptId = payload.department_id || (specializations[0]?.name || 'General Medicine')
      const visitData = {
        patient_token: payload.patient_token || `CQ-${Math.floor(100 + Math.random() * 900)}`,
        visit_type: payload.visit_type || 'walk_in',
        department_id: deptId,
        doctor_id: payload.doctor_id || null,
        notes: payload.notes || null,
        visit_date: now.toISOString().split('T')[0],
        arrival_time: now.toISOString(),
        registration_time: now.toISOString(),
      }
      return (await apiClient.post(`/clinics/${clinicId}/visits`, visitData)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      setShowAddVisit(false)
      setNewVisit({ patient_token: '', visit_type: 'walk_in', department_id: '', doctor_id: '', notes: '' })
    },
  })

  const updateVisitMutation = useMutation({
    mutationFn: async ({ visitId, payload }: { visitId: string; payload: any }) => {
      return (await apiClient.patch(`/clinics/${clinicId}/visits/${visitId}`, payload)).data
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      setSelectedVisit(updated)
    },
  })

  const deleteVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      return (await apiClient.delete(`/clinics/${clinicId}/visits/${visitId}`)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      setSelectedVisit(null)
    },
  })

  const visits = data?.items || []

  // Filter client-side for quick search & type
  const filteredVisits = visits.filter((v: any) => {
    const matchToken = !search || v.patient_token?.toLowerCase().includes(search.toLowerCase())
    const matchType = selectedType === 'all' || v.visit_type === selectedType
    return matchToken && matchType
  })

  // Summary Metrics
  const avgWait = visits.length > 0
    ? (visits.reduce((acc: number, v: any) => acc + (v.queue_wait_minutes || 0), 0) / visits.filter((v: any) => v.queue_wait_minutes != null).length || 0).toFixed(1)
    : '0'

  const avgConsult = visits.length > 0
    ? (visits.reduce((acc: number, v: any) => acc + (v.service_time_minutes || 0), 0) / visits.filter((v: any) => v.service_time_minutes != null).length || 0).toFixed(1)
    : '0'

  const completedCount = visits.filter((v: any) => v.departure_time != null).length

  // CSV Export
  const exportToCSV = () => {
    if (filteredVisits.length === 0) return
    const headers = ["Patient Token", "Visit Date", "Category", "Arrival Time", "Registration Wait (m)", "Queue Wait (m)", "Consult Duration (m)", "Total Stay (m)"]
    const rows = filteredVisits.map((v: any) => [
      v.patient_token,
      v.visit_date,
      v.visit_type,
      v.arrival_time,
      v.registration_wait_minutes ?? '',
      v.queue_wait_minutes ?? '',
      v.service_time_minutes ?? '',
      v.total_visit_minutes ?? ''
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `CareQueue_Visits_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (ts: string | null) => {
    if (!ts) return '—'
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  const getWaitBadge = (min: number | null) => {
    if (min == null) return <span className="text-slate-400 font-medium">—</span>
    if (min <= 15) return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">{min.toFixed(1)}m</span>
    if (min <= 30) return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-semibold">{min.toFixed(1)}m</span>
    return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold">{min.toFixed(1)}m</span>
  }

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      emergency: 'bg-rose-100 text-rose-700 border-rose-200',
      walk_in: 'bg-sky-100 text-sky-700 border-sky-200',
      follow_up: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      new: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    }
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${map[type] || 'bg-slate-100 text-slate-700'}`}>
        {type ? type.replace('_', ' ') : 'visit'}
      </span>
    )
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Records & Patient Flow</h1>
            <Badge variant="info">{data?.total || 0} Total Visits</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track arrival timestamps, registration delays, doctor consultation durations, and patient departures
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setNewVisit({
                patient_token: `CQ-${Math.floor(100 + Math.random() * 900)}`,
                visit_type: 'walk_in',
                department_id: specializations[0]?.name || 'General Medicine',
                doctor_id: doctors[0]?.id || '',
                notes: '',
              })
              setShowAddVisit(true)
            }}
            className="shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Patient Visit</span>
          </Button>

          <Button
            variant="secondary"
            onClick={exportToCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Download records as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/data/import')}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <UploadCloud className="w-4 h-4 text-sky-500" />
            <span>Import Dataset</span>
          </Button>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Visits</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{data?.total || visits.length}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">Avg Queue Wait</span>
          <span className="text-xl font-extrabold text-sky-950 mt-0.5 block">{avgWait} <span className="text-xs font-normal text-slate-500">min</span></span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Avg Consult Duration</span>
          <span className="text-xl font-extrabold text-indigo-950 mt-0.5 block">{avgConsult} <span className="text-xs font-normal text-slate-500">min</span></span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Completed Departures</span>
          <span className="text-xl font-extrabold text-emerald-950 mt-0.5 block">{completedCount} <span className="text-xs font-normal text-slate-500">patients</span></span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search by Token */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Token (e.g. CQ-123)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'walk_in', 'follow_up', 'new', 'emergency'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === t
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'All Visits' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden p-0">
        {filteredVisits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Patient Visits Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              There are no visit records matching your filters. Upload an outpatient dataset or record live patient arrivals.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate('/data/import')} className="shadow-md shadow-sky-500/20">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Dataset File</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setNewVisit({
                    patient_token: `CQ-${Math.floor(100 + Math.random() * 900)}`,
                    visit_type: 'walk_in',
                    department_id: specializations[0]?.name || 'General Medicine',
                    doctor_id: doctors[0]?.id || '',
                    notes: '',
                  })
                  setShowAddVisit(true)
                }}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                <span>Record Patient Visit</span>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Looking for today's reception sample data?</span>
              <a
                href="/samples/todays_reception_for_visit_records_module.csv"
                download="todays_reception_for_visit_records_module.csv"
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Download Today's Reception Flow (.csv)</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Patient Token</th>
                  <th className="py-3.5 px-4">Visit Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Arrival Time</th>
                  <th className="py-3.5 px-4">Queue Wait</th>
                  <th className="py-3.5 px-4">Service Time</th>
                  <th className="py-3.5 px-4">Total Stay</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((v: any) => (
                  <tr
                    key={v.id || v.patient_token}
                    onClick={() => setSelectedVisit(v)}
                    className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                          {v.patient_token?.substring(0, 2) || 'CQ'}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {v.patient_token}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {v.visit_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {getTypeBadge(v.visit_type)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">
                      {formatTime(v.arrival_time)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getWaitBadge(v.queue_wait_minutes)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">
                      {v.service_time_minutes != null ? `${v.service_time_minutes.toFixed(1)}m` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                      {v.total_visit_minutes != null ? `${v.total_visit_minutes.toFixed(1)}m` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
                        Timeline →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous Page
            </Button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {data.total_pages} ({data.total} records)
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page === data.total_pages}
            >
              Next Page
            </Button>
          </div>
        )}
      </Card>

      {/* Patient Milestone Journey Drawer (Slide-Over) */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center">
                    CQ
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedVisit.patient_token}</h3>
                    <p className="text-xs text-slate-500">{selectedVisit.visit_date} • {selectedVisit.visit_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Milestones Flow */}
              <div className="mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Patient Operational Milestones
                </p>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* 1. Arrival */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white z-10">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Clinic Arrival</p>
                      <p className="text-xs font-mono text-slate-500">{formatTime(selectedVisit.arrival_time)}</p>
                    </div>
                  </div>

                  {/* 2. Registration */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white z-10">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Desk Registration Completed</p>
                      <p className="text-xs font-mono text-slate-500">{formatTime(selectedVisit.registration_time)}</p>
                      {selectedVisit.registration_wait_minutes != null && (
                        <span className="text-[11px] text-slate-500">Wait: {selectedVisit.registration_wait_minutes} min</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Called to Queue */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white z-10">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Called to Consultation Room</p>
                      <p className="text-xs font-mono text-slate-500">{formatTime(selectedVisit.called_time)}</p>
                      {selectedVisit.queue_wait_minutes != null && (
                        <span className="text-[11px] text-amber-700 font-semibold block">
                          Queue Wait: {selectedVisit.queue_wait_minutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4. Consultation */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white z-10">
                      4
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Doctor Consultation</p>
                      <p className="text-xs font-mono text-slate-500">
                        {formatTime(selectedVisit.service_start_time)} → {formatTime(selectedVisit.service_end_time)}
                      </p>
                      {selectedVisit.service_time_minutes != null && (
                        <span className="text-[11px] text-indigo-700 font-semibold block">
                          Duration: {selectedVisit.service_time_minutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5. Departure */}
                  <div className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white z-10">
                      5
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Clinic Departure</p>
                      <p className="text-xs font-mono text-slate-500">{formatTime(selectedVisit.departure_time)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Stay Summary */}
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Total Patient Clinic Stay</span>
                    <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
                      {selectedVisit.total_visit_minutes != null ? `${selectedVisit.total_visit_minutes} minutes` : 'In Progress'}
                    </span>
                  </div>
                  {selectedVisit.departure_time ? (
                    <Badge variant="success">Completed</Badge>
                  ) : (
                    <Badge variant="warning">Active in Clinic</Badge>
                  )}
                </div>

                {/* Clinical Context */}
                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                    <span className="font-semibold text-slate-800">{selectedVisit.department_id || 'General OPD'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Doctor</span>
                    <span className="font-semibold text-slate-800">
                      {doctors.find((d: any) => d.id === selectedVisit.doctor_id)?.name || 'On-Duty Pool'}
                    </span>
                  </div>
                </div>

                {selectedVisit.notes && (
                  <div className="pt-2 border-t border-slate-200/80 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Clinical Notes</span>
                    <p className="text-slate-700 italic mt-0.5">{selectedVisit.notes}</p>
                  </div>
                )}
              </div>

              {/* Live Flow Progression Actions */}
              {!selectedVisit.departure_time && (
                <div className="mt-4 p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2">
                  <p className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                    Operational Flow Controls
                  </p>
                  {!selectedVisit.called_time && (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => updateVisitMutation.mutate({
                        visitId: selectedVisit.id,
                        payload: { called_time: new Date().toISOString() }
                      })}
                      loading={updateVisitMutation.isPending}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Call Patient to Consultation Room</span>
                    </Button>
                  )}
                  {selectedVisit.called_time && !selectedVisit.service_start_time && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => updateVisitMutation.mutate({
                        visitId: selectedVisit.id,
                        payload: { service_start_time: new Date().toISOString() }
                      })}
                      loading={updateVisitMutation.isPending}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Begin Doctor Consultation</span>
                    </Button>
                  )}
                  {selectedVisit.service_start_time && !selectedVisit.service_end_time && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => updateVisitMutation.mutate({
                        visitId: selectedVisit.id,
                        payload: { service_end_time: new Date().toISOString() }
                      })}
                      loading={updateVisitMutation.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Finish Doctor Consultation</span>
                    </Button>
                  )}
                  {selectedVisit.service_end_time && !selectedVisit.departure_time && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-slate-800 hover:bg-slate-900 text-white"
                      onClick={() => updateVisitMutation.mutate({
                        visitId: selectedVisit.id,
                        payload: { departure_time: new Date().toISOString() }
                      })}
                      loading={updateVisitMutation.isPending}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Record Patient Departure</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSelectedVisit(null)}
              >
                Close Patient Flow
              </Button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete visit token ${selectedVisit.patient_token}?`)) {
                    deleteVisitMutation.mutate(selectedVisit.id)
                  }
                }}
                disabled={deleteVisitMutation.isPending}
                className="w-full py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Visit Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Record New Patient Visit */}
      <Modal
        open={showAddVisit}
        onClose={() => setShowAddVisit(false)}
        title="Record New Patient Visit"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddVisit(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-visit-form"
              loading={createVisitMutation.isPending}
            >
              Save Patient Visit
            </Button>
          </>
        }
      >
        <form
          id="add-visit-form"
          onSubmit={e => {
            e.preventDefault()
            createVisitMutation.mutate(newVisit)
          }}
          className="space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Patient Token / ID *
              </label>
              <button
                type="button"
                onClick={() => setNewVisit(v => ({ ...v, patient_token: `CQ-${Math.floor(100 + Math.random() * 900)}` }))}
                className="text-[11px] font-semibold text-sky-600 hover:underline"
              >
                Auto Generate
              </button>
            </div>
            <input
              required
              placeholder="e.g. CQ-204"
              value={newVisit.patient_token}
              onChange={e => setNewVisit(v => ({ ...v, patient_token: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Visit Category *
            </label>
            <select
              value={newVisit.visit_type}
              onChange={e => setNewVisit(v => ({ ...v, visit_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="walk_in">Walk-in Consultation</option>
              <option value="follow_up">Follow-up Visit</option>
              <option value="new">New Patient Registration</option>
              <option value="emergency">Emergency / Triage Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Specialization / Clinical Wing *
            </label>
            <select
              value={newVisit.department_id}
              onChange={e => setNewVisit(v => ({ ...v, department_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              {specializations.length > 0 ? (
                specializations.map((s: any) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.code || 'OPD'})
                  </option>
                ))
              ) : (
                <>
                  <option value="General Medicine">General Medicine (GEN)</option>
                  <option value="Cardiology">Cardiology (CARD)</option>
                  <option value="Pediatrics">Pediatrics (PED)</option>
                  <option value="Orthopedics">Orthopedics (ORTHO)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Assigned Consulting Doctor (Optional)
            </label>
            <select
              value={newVisit.doctor_id}
              onChange={e => setNewVisit(v => ({ ...v, doctor_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="">— Unassigned / General Roster —</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization || 'Consultant'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Clinical Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Enter symptoms or triage priority..."
              value={newVisit.notes}
              onChange={e => setNewVisit(v => ({ ...v, notes: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
