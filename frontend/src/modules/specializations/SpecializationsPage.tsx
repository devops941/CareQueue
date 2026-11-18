import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Layers, Plus, Clock, Search, Shield, Activity, Stethoscope,
  Trash2, CheckCircle2, Building2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SpecializationForm {
  name: string
  code: string
  service_type: 'consultation' | 'diagnostic' | 'procedure' | 'pharmacy'
  avg_service_time_minutes: number
  max_concurrent_patients: number
  description: string
}

export default function SpecializationsPage() {
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id

  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState<SpecializationForm>({
    name: '',
    code: '',
    service_type: 'consultation',
    avg_service_time_minutes: 15,
    max_concurrent_patients: 1,
    description: '',
  })

  // Queries
  const { data: specializations = [], isLoading } = useQuery({
    queryKey: ['departments', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/departments`)).data,
    enabled: !!clinicId,
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/doctors`)).data,
    enabled: !!clinicId,
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: SpecializationForm) => {
      return (await apiClient.post(`/clinics/${clinicId}/departments`, payload)).data
    },
    onSuccess: () => {
      toast.success('Specialization created successfully!')
      qc.invalidateQueries({ queryKey: ['departments', clinicId] })
      setShowAdd(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create specialization')
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (deptId: string) => {
      return (await apiClient.delete(`/clinics/${clinicId}/departments/${deptId}`)).data
    },
    onSuccess: () => {
      toast.success('Specialization deactivated')
      qc.invalidateQueries({ queryKey: ['departments', clinicId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to deactivate')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      service_type: 'consultation',
      avg_service_time_minutes: 15,
      max_concurrent_patients: 1,
      description: '',
    })
  }

  // Filter
  const filtered = specializations.filter((s: any) => {
    const q = search.toLowerCase()
    return (
      s.name?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      s.service_type?.toLowerCase().includes(q)
    )
  })

  // Count doctors per dept
  const getDoctorCount = (deptId: string, deptName: string) => {
    return doctors.filter((d: any) => d.department_id === deptId || d.specialization === deptName).length
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Specializations & Wings</h1>
            <Badge variant="info">{specializations.length} Specializations</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Master registry of medical specialties, consulting departments, and service SLAs that feed Doctor Rosters
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              resetForm()
              setShowAdd(true)
            }}
            className="flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specialization</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          placeholder="Search specializations by name, code, or service category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-sm"
        />
      </div>

      {/* Specializations Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 font-medium">Loading clinical specializations...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-2 border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Specializations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Register your clinic's medical specialties using the Add Specialization button.
          </p>
          <Button
            onClick={() => {
              resetForm()
              setShowAdd(true)
            }}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Specialization
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s: any) => {
            const docCount = getDoctorCount(s.id, s.name)
            return (
              <div
                key={s.id || s.code}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-sky-500/20">
                        {s.code || s.name?.slice(0, 3)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-sm">
                          {s.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-mono font-bold tracking-wider uppercase border border-sky-100">
                          {s.code}
                        </span>
                      </div>
                    </div>

                    <Badge variant={s.is_active !== false ? 'success' : 'neutral'}>
                      {s.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 min-h-[32px] leading-relaxed">
                    {s.description || 'Specialized outpatient consultation and treatment wing.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-sky-500" /> Consult Target SLA:
                    </span>
                    <span className="font-bold text-slate-900">{s.avg_service_time_minutes || 15} mins</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Assigned Doctors:
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      {docCount} {docCount === 1 ? 'Doctor' : 'Doctors'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="text-slate-500">Service Category:</span>
                    <span className="capitalize font-semibold text-slate-800">{s.service_type || 'consultation'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* POPUP MODAL: Add Specialization */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Register Clinical Specialization"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-specialization-form"
              loading={createMutation.isPending}
            >
              Save Specialization
            </Button>
          </>
        }
      >
        <form
          id="add-specialization-form"
          onSubmit={e => {
            e.preventDefault()
            createMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Specialization Name
            </label>
            <input
              required
              placeholder="e.g. Cardiology OPD"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Specialty Code
              </label>
              <input
                required
                placeholder="e.g. CARD"
                value={formData.code}
                onChange={e => setFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Service Category
              </label>
              <select
                value={formData.service_type}
                onChange={e => setFormData(f => ({ ...f, service_type: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="consultation">Consultation OPD</option>
                <option value="diagnostic">Diagnostic Wing</option>
                <option value="procedure">Minor Procedure</option>
                <option value="pharmacy">Pharmacy Dispense</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Consultation SLA (Min)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                required
                value={formData.avg_service_time_minutes}
                onChange={e => setFormData(f => ({ ...f, avg_service_time_minutes: +e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default target time per patient visit</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Max Parallel Capacity
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.max_concurrent_patients}
                onChange={e => setFormData(f => ({ ...f, max_concurrent_patients: +e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Simultaneous active consultation rooms</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Description / Focus Area
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Clinical diagnosis and treatment of cardiovascular disorders and hypertension."
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
