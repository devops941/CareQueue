import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Building2, Clock, MapPin, Mail, Globe, Shield, Plus, Edit3, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClinicSettingsPage() {
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id

  const [showAddDept, setShowAddDept] = useState(false)
  const [showEditClinic, setShowEditClinic] = useState(false)

  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    service_type: 'consultation',
    avg_service_time_minutes: 15,
    max_concurrent_patients: 1,
  })

  const [editClinicData, setEditClinicData] = useState({
    name: '',
    address: '',
    contact_email: '',
    timezone: 'Asia/Kolkata',
  })

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      const res = await apiClient.get(`/clinics/${clinicId}`)
      setEditClinicData({
        name: res.data.name || '',
        address: res.data.address || '',
        contact_email: res.data.contact_email || '',
        timezone: res.data.timezone || 'Asia/Kolkata',
      })
      return res.data
    },
    enabled: !!clinicId,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', clinicId],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/departments`)).data,
    enabled: !!clinicId,
  })

  // Add Department Mutation
  const addDeptMutation = useMutation({
    mutationFn: async (payload: typeof newDept) => {
      return (await apiClient.post(`/clinics/${clinicId}/departments`, payload)).data
    },
    onSuccess: () => {
      toast.success('Clinical department created successfully!')
      qc.invalidateQueries({ queryKey: ['departments', clinicId] })
      setShowAddDept(false)
      setNewDept({
        name: '',
        code: '',
        service_type: 'consultation',
        avg_service_time_minutes: 15,
        max_concurrent_patients: 1,
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to add department')
    },
  })

  // Update Clinic Profile Mutation
  const updateClinicMutation = useMutation({
    mutationFn: async (payload: typeof editClinicData) => {
      return (await apiClient.patch(`/clinics/${clinicId}`, payload)).data
    },
    onSuccess: () => {
      toast.success('Clinic profile updated successfully!')
      qc.invalidateQueries({ queryKey: ['clinic', clinicId] })
      setShowEditClinic(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update clinic')
    },
  })

  if (isLoading) {
    return <div className="text-slate-400 py-12 text-center font-medium">Loading clinic configuration...</div>
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Operational Configuration</h1>
            <Badge variant="info">Multi-Tenant</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Operating schedules, facility profile, and clinical service departments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setShowEditClinic(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Edit Facility</span>
          </Button>
          <Button
            onClick={() => setShowAddDept(true)}
            className="flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </Button>
        </div>
      </div>

      {/* Main Clinic Profile Card */}
      <Card title="Clinic Facility Profile" className="border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            {clinic?.name?.[0] || 'C'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{clinic?.name || 'CareQueue Clinic'}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Operational Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {clinic?.address || 'Healthcare Boulevard'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {clinic?.contact_email || 'admin@gmail.com'}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Timezone Routing</span>
            <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-500" />
              {clinic?.timezone || 'Asia/Kolkata'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Standard OPD Shift</span>
            <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              08:00 AM – 06:00 PM
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security Isolation</span>
            <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-500" />
              Isolated Multi-Tenant Node
            </span>
          </div>
        </div>
      </Card>

      {/* Departments Overview */}
      <Card
        title="Active Clinical Departments"
        subtitle="Routing departments for patient arrivals & consultation"
        headerAction={
          <Button
            size="sm"
            onClick={() => setShowAddDept(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Dept</span>
          </Button>
        }
        className="border-slate-200 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {departments.map((dept: any) => (
            <div key={dept.id || dept.name} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px] font-bold tracking-wider">{dept.code}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Service Type:</span>
                <span className="capitalize font-semibold text-slate-700">{dept.service_type || 'consultation'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Avg Consult:</span>
                <span className="font-semibold text-slate-800">{dept.avg_service_time_minutes || 15} mins</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Max Capacity:</span>
                <span className="font-semibold text-slate-800">{dept.max_concurrent_patients || 1} patients</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* POPUP MODAL: Add Department */}
      <Modal
        open={showAddDept}
        onClose={() => setShowAddDept(false)}
        title="Add Clinical Department"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddDept(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-dept-form"
              loading={addDeptMutation.isPending}
            >
              Create Department
            </Button>
          </>
        }
      >
        <form
          id="add-dept-form"
          onSubmit={e => {
            e.preventDefault()
            addDeptMutation.mutate(newDept)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Department Name
            </label>
            <input
              required
              placeholder="e.g. Cardiology OPD"
              value={newDept.name}
              onChange={e => setNewDept(d => ({ ...d, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Department Code
              </label>
              <input
                required
                placeholder="e.g. CARD"
                value={newDept.code}
                onChange={e => setNewDept(d => ({ ...d, code: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Service Type
              </label>
              <select
                value={newDept.service_type}
                onChange={e => setNewDept(d => ({ ...d, service_type: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="consultation">Consultation</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="procedure">Procedure</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Avg Service Time (Min)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={newDept.avg_service_time_minutes}
                onChange={e => setNewDept(d => ({ ...d, avg_service_time_minutes: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Max Concurrent Patients
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={newDept.max_concurrent_patients}
                onChange={e => setNewDept(d => ({ ...d, max_concurrent_patients: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL: Edit Clinic Facility */}
      <Modal
        open={showEditClinic}
        onClose={() => setShowEditClinic(false)}
        title="Edit Clinic Facility Profile"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditClinic(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-clinic-form"
              loading={updateClinicMutation.isPending}
            >
              Save Profile
            </Button>
          </>
        }
      >
        <form
          id="edit-clinic-form"
          onSubmit={e => {
            e.preventDefault()
            updateClinicMutation.mutate(editClinicData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Clinic Name
            </label>
            <input
              required
              value={editClinicData.name}
              onChange={e => setEditClinicData(c => ({ ...c, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Address / Location
            </label>
            <input
              required
              value={editClinicData.address}
              onChange={e => setEditClinicData(c => ({ ...c, address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={editClinicData.contact_email}
                onChange={e => setEditClinicData(c => ({ ...c, contact_email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={editClinicData.timezone}
                onChange={e => setEditClinicData(c => ({ ...c, timezone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
