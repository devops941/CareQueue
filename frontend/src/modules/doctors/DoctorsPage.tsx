import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Stethoscope, Clock, Plus, User, CheckCircle2, Building2,
  Phone, Mail, Award, DoorOpen, Calendar, Search, Filter, ShieldCheck, Sparkles, Layers,
  Check, Sun, CalendarDays, Timer, Users
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DoctorFormData {
  full_name: string
  specialization: string
  department_id: string
  qualification: string
  license_number: string
  room_number: string
  phone: string
  email: string
  shift_timing: string
  available_days: string[]
  start_time: string
  end_time: string
  has_break: boolean
  break_start: string
  break_end: string
  avg_consultation_minutes: number
  max_patients_per_slot: number
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const format12Hour = (timeStr: string) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`
}

const formatDaysLabel = (days: string[] = []) => {
  if (!days || days.length === 0) return 'No days scheduled'
  if (days.length === 7) return 'All 7 Days (Mon - Sun)'
  const standard6 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (days.length === 6 && standard6.every(d => days.includes(d)) && !days.includes('Sun')) {
    return 'Mon - Sat'
  }
  const standard5 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  if (days.length === 5 && standard5.every(d => days.includes(d)) && !days.includes('Sat') && !days.includes('Sun')) {
    return 'Mon - Fri'
  }
  return days.join(', ')
}

const calculateShiftHours = (start: string, end: string, hasBreak: boolean, bStart: string, bEnd: string) => {
  if (!start || !end) return '0'
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diffMin = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))
  if (hasBreak && bStart && bEnd) {
    const [bsh, bsm] = bStart.split(':').map(Number)
    const [beh, bem] = bEnd.split(':').map(Number)
    const breakMin = (beh * 60 + (bem || 0)) - (bsh * 60 + (bsm || 0))
    if (breakMin > 0) diffMin -= breakMin
  }
  return diffMin > 0 ? (diffMin / 60).toFixed(1) : '0'
}

export default function DoctorsPage() {
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const qc = useQueryClient()

  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('ALL')

  const [form, setForm] = useState<DoctorFormData>({
    full_name: '',
    specialization: 'General Medicine',
    department_id: '',
    qualification: '',
    license_number: '',
    room_number: '',
    phone: '',
    email: '',
    shift_timing: 'Mon-Sat | 09:00 AM - 01:00 PM',
    available_days: [...DEFAULT_DAYS],
    start_time: '09:00',
    end_time: '13:00',
    has_break: false,
    break_start: '13:00',
    break_end: '14:00',
    avg_consultation_minutes: 15,
    max_patients_per_slot: 20,
  })

  // Queries
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/doctors`)).data,
    enabled: !!clinicId,
  })

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/departments`)).data,
    enabled: !!clinicId,
  })

  // Auto-set department when departments load
  useEffect(() => {
    if (departments.length > 0 && !form.department_id) {
      const first = departments[0]
      setForm(prev => ({
        ...prev,
        department_id: first.id,
        specialization: first.name,
        avg_consultation_minutes: first.avg_service_time_minutes || 15,
      }))
    }
  }, [departments])

  // Computed timing summary
  const computedTiming = useMemo(() => {
    const days = form.available_days?.length ? form.available_days : DEFAULT_DAYS
    const daysStr = formatDaysLabel(days)
    const startStr = format12Hour(form.start_time || '09:00')
    const endStr = format12Hour(form.end_time || '13:00')
    let s = `${daysStr} | ${startStr} - ${endStr}`
    if (form.has_break && form.break_start && form.break_end) {
      s += ` (Break: ${format12Hour(form.break_start)} - ${format12Hour(form.break_end)})`
    }
    return s
  }, [form.available_days, form.start_time, form.end_time, form.has_break, form.break_start, form.break_end])

  const shiftHours = useMemo(() => {
    return calculateShiftHours(form.start_time, form.end_time, form.has_break, form.break_start, form.break_end)
  }, [form.start_time, form.end_time, form.has_break, form.break_start, form.break_end])

  // Create Doctor Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: DoctorFormData) => {
      const formattedPayload = {
        ...payload,
        shift_timing: computedTiming,
        available_days: payload.available_days?.length ? payload.available_days : DEFAULT_DAYS,
      }
      return (await apiClient.post(`/clinics/${clinicId}/doctors`, formattedPayload)).data
    },
    onSuccess: () => {
      toast.success('Physician registered with customized schedule!')
      qc.invalidateQueries({ queryKey: ['doctors', clinicId] })
      setShowAdd(false)
      resetDoctorForm()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to register physician')
    },
  })

  // Deactivate Doctor Mutation
  const deactivateMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      return (await apiClient.delete(`/clinics/${clinicId}/doctors/${doctorId}`)).data
    },
    onSuccess: () => {
      toast.success('Doctor removed from active roster')
      qc.invalidateQueries({ queryKey: ['doctors', clinicId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to deactivate doctor')
    },
  })

  const resetDoctorForm = () => {
    const firstDept = departments[0]
    setForm({
      full_name: '',
      specialization: firstDept?.name || 'General Medicine',
      department_id: firstDept?.id || '',
      qualification: '',
      license_number: '',
      room_number: '',
      phone: '',
      email: '',
      shift_timing: 'Mon-Sat | 09:00 AM - 01:00 PM',
      available_days: [...DEFAULT_DAYS],
      start_time: '09:00',
      end_time: '13:00',
      has_break: false,
      break_start: '13:00',
      break_end: '14:00',
      avg_consultation_minutes: firstDept?.avg_service_time_minutes || 15,
      max_patients_per_slot: 20,
    })
  }

  const handleOpenAddModal = () => {
    resetDoctorForm()
    setShowAdd(true)
  }

  const toggleDay = (day: string) => {
    setForm(prev => {
      const current = prev.available_days || []
      const exists = current.includes(day)
      const updated = exists ? current.filter(d => d !== day) : [...current, day]
      return { ...prev, available_days: updated }
    })
  }

  const setPresetDays = (preset: 'all' | 'mon-sat' | 'mon-fri') => {
    if (preset === 'all') setForm(f => ({ ...f, available_days: [...ALL_DAYS] }))
    if (preset === 'mon-sat') setForm(f => ({ ...f, available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }))
    if (preset === 'mon-fri') setForm(f => ({ ...f, available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }))
  }

  const handleSpecializationChange = (deptId: string) => {
    const found = departments.find((d: any) => d.id === deptId)
    if (found) {
      setForm(prev => ({
        ...prev,
        department_id: found.id,
        specialization: found.name,
        avg_consultation_minutes: found.avg_service_time_minutes || prev.avg_consultation_minutes,
      }))
    }
  }

  // Filtering
  const filteredDoctors = doctors.filter((doc: any) => {
    const q = search.toLowerCase()
    const matchesSearch =
      doc.full_name?.toLowerCase().includes(q) ||
      doc.specialization?.toLowerCase().includes(q) ||
      doc.qualification?.toLowerCase().includes(q) ||
      doc.room_number?.toLowerCase().includes(q)

    const matchesSpecialty =
      selectedSpecialtyFilter === 'ALL' ||
      doc.department_id === selectedSpecialtyFilter ||
      doc.specialization === selectedSpecialtyFilter

    return matchesSearch && matchesSpecialty
  })

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Physician & Consulting Roster</h1>
            <Badge variant="info">{doctors.length} Doctors Registered</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Clinical consulting physicians with room assignments, working days, and precise shift hours
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={handleOpenAddModal} className="flex items-center gap-1.5 shadow-md shadow-sky-500/20">
            <Plus className="w-4 h-4" />
            <span>Add Consulting Physician</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            placeholder="Search by physician name, qualification, room..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
          />
        </div>

        {/* Specialization Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSpecialtyFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSpecialtyFilter === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Specialties ({doctors.length})
          </button>
          {departments.map((dept: any) => {
            const count = doctors.filter((d: any) => d.department_id === dept.id || d.specialization === dept.name).length
            return (
              <button
                key={dept.id || dept.name}
                onClick={() => setSelectedSpecialtyFilter(dept.id || dept.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedSpecialtyFilter === (dept.id || dept.name)
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{dept.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoadingDoctors ? (
        <div className="text-center py-16 text-slate-400 font-medium">Loading clinical roster...</div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-2 border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Doctors Match Selected Filter</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedSpecialtyFilter !== 'ALL'
              ? 'Try adjusting your search keywords or specialty filter tab.'
              : 'Add doctors to assign patient visits and calculate consultation durations accurately.'}
          </p>
          <div className="mt-5">
            <Button onClick={handleOpenAddModal} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Register First Doctor</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredDoctors.map((doc: any) => (
            <div
              key={doc.id || doc.full_name}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Avatar, Name, Specialty, Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                      {doc.full_name
                        ?.replace(/^(Dr\.|Doctor|Dr)\s*/i, '')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2) || 'DR'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base leading-tight">
                        {doc.full_name}
                      </h4>
                      {doc.qualification && (
                        <p className="text-xs font-semibold text-sky-700 mt-0.5 flex items-center gap-1">
                          <Award className="w-3 h-3 text-sky-500" />
                          <span>{doc.qualification}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {doc.specialization}
                        </span>
                        {doc.room_number && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold flex items-center gap-1 border border-amber-200/60">
                            <DoorOpen className="w-3 h-3 text-amber-600" />
                            <span>{doc.room_number}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant={doc.is_active ? 'success' : 'neutral'} className="text-[10px] tracking-wide uppercase font-bold">
                    {doc.is_active ? 'On Duty' : 'Inactive'}
                  </Badge>
                </div>

                {/* Schedule & Timing Ribbon */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-600" /> Available Days:
                    </span>
                    <span className="font-bold text-slate-900">
                      {doc.available_days?.length
                        ? formatDaysLabel(doc.available_days)
                        : doc.shift_timing?.split('|')[0]?.trim() || 'Mon - Sat'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> Shift Hours:
                    </span>
                    <span className="font-semibold text-emerald-800 font-mono text-[11px]">
                      {doc.start_time && doc.end_time
                        ? `${format12Hour(doc.start_time)} – ${format12Hour(doc.end_time)}`
                        : doc.shift_timing?.split('|')[1]?.trim() || doc.shift_timing || '09:00 AM - 01:00 PM'}
                    </span>
                  </div>
                </div>

                {/* Clinical & License Meta */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {doc.license_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Medical Reg No:</span>
                      <span className="font-mono font-semibold text-slate-800">{doc.license_number}</span>
                    </div>
                  )}

                  {doc.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> Phone:
                      </span>
                      <span className="font-medium text-slate-700">{doc.phone}</span>
                    </div>
                  )}

                  {doc.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> Email:
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{doc.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Consultation SLA and Action */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  <span>Target Consult: <strong>{doc.avg_consultation_minutes || 15} mins</strong></span>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Deactivate ${doc.full_name} from active roster?`)) {
                      deactivateMutation.mutate(doc.id)
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  title="Deactivate Doctor"
                >
                  <span className="text-[11px] font-semibold text-slate-400 hover:text-rose-600">Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL: Register New Doctor (Spacious 2-Column Layout Without Inner Double Scroll) */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Register New Consulting Physician"
        subtitle="Configure physician credentials, clinic chamber, and weekly consultation schedules"
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-doctor-form"
              loading={createMutation.isPending}
              className="shadow-md shadow-sky-500/20"
            >
              Save & Activate Physician
            </Button>
          </>
        }
      >
        <form
          id="add-doctor-form"
          onSubmit={e => {
            e.preventDefault()
            createMutation.mutate(form)
          }}
          className="space-y-6"
        >
          {/* MASTER 2-COLUMN SPLIT: NO SQUEEZING & NO INNER SCROLLBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Identity, Specialization & Practice Credentials */}
            <div className="space-y-4">
              <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" /> 1. Physician Profile & Chamber
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Core Details</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Doctor Full Name *
                </label>
                <input
                  required
                  placeholder="e.g. Dr. Kavitha Ramesh, MD"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* Specialization Selection from Module */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Specialization Wing *
                </label>

                {departments.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    No specializations found. Please configure them in the Specializations Module.
                  </div>
                ) : (
                  <select
                    required
                    value={form.department_id}
                    onChange={e => handleSpecializationChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-sm"
                  >
                    <option value="">— Select Specialization from Module —</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code || 'GEN'}) — Target SLA: {dept.avg_service_time_minutes || 15}m
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Synchronized with the <strong>Specializations Module</strong>
                </span>
              </div>

              {/* Degrees & Medical License in 2 sub-columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Degrees / Qualifications
                  </label>
                  <input
                    placeholder="e.g. MBBS, MD, DM"
                    value={form.qualification}
                    onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Medical License No.
                  </label>
                  <input
                    placeholder="e.g. NMC-2019-94812"
                    value={form.license_number}
                    onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Chamber & Direct Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    OPD Cabin / Room No.
                  </label>
                  <input
                    placeholder="e.g. Cabin 204 (1st Floor)"
                    value={form.room_number}
                    onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Direct Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98401 23456"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Physician Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. dr.kavitha@clinic.in"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Working Schedule, Timings & Simulation Parameters */}
            <div className="space-y-4">
              <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" /> 2. OPD Schedule & Hours
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Weekly Shift</span>
              </div>

              {/* Schedule Box */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                {/* Days Header & Presets */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Available Days:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPresetDays('mon-sat')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-600 transition-colors shadow-2xs"
                    >
                      Mon - Sat
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDays('mon-fri')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-600 transition-colors shadow-2xs"
                    >
                      Mon - Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDays('all')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-sky-400 hover:text-sky-600 transition-colors shadow-2xs"
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>

                {/* 7 Days Toggle Pills with High-Fidelity Active State */}
                <div className="grid grid-cols-7 gap-1.5">
                  {ALL_DAYS.map(day => {
                    const active = (form.available_days || []).includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 select-none ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{day}</span>
                        <span className={`text-[10px] font-extrabold ${active ? 'text-white' : 'text-slate-300'}`}>
                          {active ? '✓' : '•'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Shift Hours Time Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" /> Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 font-mono block">
                      {format12Hour(form.start_time)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 font-mono block">
                      {format12Hour(form.end_time)}
                    </span>
                  </div>
                </div>

                {/* Lunch / Break Interval Option */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.has_break}
                      onChange={e => setForm(f => ({ ...f, has_break: e.target.checked }))}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Include Lunch / Intermission Break</span>
                  </label>

                  {form.has_break && (
                    <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Break Start</label>
                        <input
                          type="time"
                          value={form.break_start}
                          onChange={e => setForm(f => ({ ...f, break_start: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Break End</label>
                        <input
                          type="time"
                          value={form.break_end}
                          onChange={e => setForm(f => ({ ...f, break_end: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Computed Schedule Live Preview Card */}
                <div className="p-3 bg-white rounded-xl border border-sky-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Effective Schedule</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{computedTiming}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                    <span className="text-xs font-extrabold text-sky-600">{shiftHours} Hrs/Day</span>
                  </div>
                </div>
              </div>

              {/* Consultation SLA & Maximum Capacity */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-sky-500" /> Consult SLA (Min) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="90"
                    value={form.avg_consultation_minutes}
                    onChange={e => setForm(f => ({ ...f, avg_consultation_minutes: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Queue modeling SLA</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-500" /> Max Capacity / Shift
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={form.max_patients_per_slot}
                    onChange={e => setForm(f => ({ ...f, max_patients_per_slot: +e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Daily patient limit</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
