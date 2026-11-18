import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Building2, Clock, Users, Stethoscope, Sparkles, CheckCircle2,
  ArrowRight, ArrowLeft, ShieldCheck, MapPin, Mail, Phone, Calendar, Check
} from 'lucide-react'

const STANDARD_DEPARTMENTS = [
  { name: 'General Medicine', code: 'GEN', target_service_time: 15, capacity: 2, selected: true },
  { name: 'Cardiology', code: 'CARD', target_service_time: 20, capacity: 1, selected: true },
  { name: 'Pediatrics', code: 'PED', target_service_time: 15, capacity: 2, selected: true },
  { name: 'Orthopedics', code: 'ORTHO', target_service_time: 15, capacity: 1, selected: true },
  { name: 'Dermatology', code: 'DERM', target_service_time: 15, capacity: 1, selected: false },
  { name: 'Diagnostic Pathology & Lab', code: 'LAB', target_service_time: 10, capacity: 3, selected: false },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id

  const [step, setStep] = useState(1)

  // Step 1: Hospital Facility Profile
  const [facility, setFacility] = useState({
    name: 'CareQueue City General Clinic',
    address: '124 Healthcare Boulevard, Chennai, Tamil Nadu',
    contact_email: user.email || 'admin@clinic.in',
    contact_phone: '+91 98401 23456',
    timezone: 'Asia/Kolkata',
    shift_start: '08:00',
    shift_end: '18:00',
  })

  // Step 2: Clinical Departments
  const [departments, setDepartments] = useState(STANDARD_DEPARTMENTS)

  // Step 3: Lead Doctor
  const [doctor, setDoctor] = useState({
    name: 'Dr. Kavitha Ramesh, MD',
    specialization: 'General Medicine',
    degrees: 'MBBS, MD (General Medicine)',
    license_number: 'NMC-2019-94812',
    room_number: 'Cabin 101 (Ground Floor)',
    phone: '+91 98401 23456',
    email: 'dr.kavitha@clinic.in',
    target_consultation_minutes: 15,
  })

  // Step 4: Data Initializer
  const [seedDemoVisits, setSeedDemoVisits] = useState(false)

  const toggleDept = (index: number) => {
    setDepartments(prev =>
      prev.map((d, i) => (i === index ? { ...d, selected: !d.selected } : d))
    )
  }

  const onboardingMutation = useMutation({
    mutationFn: async () => {
      const activeDepts = departments
        .filter(d => d.selected)
        .map(({ name, code, target_service_time, capacity }) => ({
          name, code, target_service_time, capacity
        }))

      const payload = {
        name: facility.name,
        address: facility.address,
        contact_email: facility.contact_email,
        contact_phone: facility.contact_phone,
        timezone: facility.timezone,
        shift_start: facility.shift_start,
        shift_end: facility.shift_end,
        departments: activeDepts,
        lead_doctor: doctor.name.trim() ? doctor : null,
        seed_demo_visits: seedDemoVisits,
      }

      return (await apiClient.post(`/clinics/${clinicId}/onboarding`, payload)).data
    },
    onSuccess: (data) => {
      localStorage.setItem('cq_onboarded', 'true')
      const updatedUser = { ...user, is_onboarded: true, clinic_name: facility.name }
      localStorage.setItem('cq_user', JSON.stringify(updatedUser))
      qc.invalidateQueries()
      navigate('/dashboard', { replace: true })
    },
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-sky-500/20 text-base">
            CQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">CareQueue</span>
              <Badge variant="info">Setup Wizard</Badge>
            </div>
            <p className="text-xs text-slate-500">First-Time Hospital Operational Onboarding</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Step {step} of 5</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-4xl w-full mx-auto my-auto">
        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            'Facility Profile',
            'Departments',
            'Consulting Doctor',
            'Data Setup',
            'Launch'
          ].map((title, idx) => {
            const stepNum = idx + 1
            const isCompleted = step > stepNum
            const isCurrent = step === stepNum
            return (
              <div key={title} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-sky-500 shadow-sm shadow-sky-500/30'
                      : 'bg-slate-200'
                  }`}
                />
                <p
                  className={`text-[11px] font-semibold text-center truncate ${
                    isCurrent ? 'text-sky-600 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {title}
                </p>
              </div>
            )
          })}
        </div>

        <Card className="border-slate-200 shadow-lg p-6 sm:p-8">
          {/* STEP 1: Hospital Facility Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Hospital Facility & OPD Operating Hours</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your primary clinic name, physical address, and standard outpatient shift hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Hospital / Clinic Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={facility.name}
                    onChange={e => setFacility(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. CareQueue City General Clinic"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Facility Address & City *
                  </label>
                  <input
                    type="text"
                    required
                    value={facility.address}
                    onChange={e => setFacility(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. 124 Healthcare Boulevard, Anna Nagar, Chennai"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Official Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={facility.contact_email}
                    onChange={e => setFacility(f => ({ ...f, contact_email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. contact@carequeue.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Direct Phone / Helpdesk
                  </label>
                  <input
                    type="text"
                    value={facility.contact_phone}
                    onChange={e => setFacility(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. +91 98401 23456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    OPD Shift Start Time
                  </label>
                  <input
                    type="time"
                    value={facility.shift_start}
                    onChange={e => setFacility(f => ({ ...f, shift_start: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    OPD Shift End Time
                  </label>
                  <input
                    type="time"
                    value={facility.shift_end}
                    onChange={e => setFacility(f => ({ ...f, shift_end: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Clinical Departments */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Clinical Departments & Target Consultation SLAs</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select the outpatient departments active in your clinic facility.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {departments.map((dept, idx) => (
                  <div
                    key={dept.name}
                    onClick={() => toggleDept(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between select-none ${
                      dept.selected
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{dept.name}</span>
                        <Badge variant="info" className="text-[10px] py-0 px-1.5">
                          {dept.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Target SLA: <strong>{dept.target_service_time}m</strong> consult • Capacity: <strong>{dept.capacity} chambers</strong>
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        dept.selected ? 'bg-sky-500 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {dept.selected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Lead Consulting Doctor */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Lead Consulting Doctor Registration</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register your initial physician to start modeling discrete-event doctor consultations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctor.name}
                    onChange={e => setDoctor(d => ({ ...d, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Dr. Kavitha Ramesh, MD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Specialization / Wing *
                  </label>
                  <select
                    value={doctor.specialization}
                    onChange={e => setDoctor(d => ({ ...d, specialization: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    {departments
                      .filter(d => d.selected)
                      .map(d => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Degrees & Qualifications
                  </label>
                  <input
                    type="text"
                    value={doctor.degrees}
                    onChange={e => setDoctor(d => ({ ...d, degrees: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. MBBS, MD (General Medicine)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Medical Council / NMC Reg No.
                  </label>
                  <input
                    type="text"
                    value={doctor.license_number}
                    onChange={e => setDoctor(d => ({ ...d, license_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. NMC-2019-94812"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    OPD Room / Chamber Number
                  </label>
                  <input
                    type="text"
                    value={doctor.room_number}
                    onChange={e => setDoctor(d => ({ ...d, room_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Cabin 101 (Ground Floor)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Operational Data Initializer */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Operational Data Initialization</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose how you want to initialize patient queue records for your clinic facility.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Clean Production Queue (Recommended) */}
                <div
                  onClick={() => setSeedDemoVisits(false)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer select-none space-y-3 ${
                    !seedDemoVisits
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    {!seedDemoVisits && (
                      <Badge variant="success" className="text-[11px]">Recommended</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Start with Fresh Empty Queue</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Begins with zero historical records, ready for your reception staff to import datasets or generate tokens for live patients.
                    </p>
                  </div>
                </div>

                {/* Option 2: Seed Demo Data */}
                <div
                  onClick={() => setSeedDemoVisits(true)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer select-none space-y-3 ${
                    seedDemoVisits
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                    </div>
                    {seedDemoVisits && (
                      <Badge variant="neutral" className="text-[11px]">Demo Mode</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Populate 35 Demo Patient Visits</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Instantly seeds 35 synthetic outpatient visits across the past 14 days for rapid testing and demonstrations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Launch */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Review & Activate Hospital Flow</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verify your facility configuration before launching CareQueue operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Facility Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facility Profile</span>
                  <p className="text-sm font-bold text-slate-900">{facility.name}</p>
                  <p className="text-slate-600">{facility.address}</p>
                  <p className="text-slate-600 font-mono text-[11px]">{facility.contact_email} • {facility.contact_phone}</p>
                  <Badge variant="info" className="text-[10px] mt-1">
                    Shift: {facility.shift_start} – {facility.shift_end} (IST)
                  </Badge>
                </div>

                {/* Doctor Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Consulting Doctor</span>
                  <p className="text-sm font-bold text-slate-900">{doctor.name}</p>
                  <p className="text-slate-600 font-medium text-sky-700">{doctor.specialization} • {doctor.room_number}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{doctor.license_number}</p>
                </div>

                {/* Active Departments */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Clinical Departments ({departments.filter(d => d.selected).length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {departments
                      .filter(d => d.selected)
                      .map(d => (
                        <span key={d.name} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 text-xs shadow-xs">
                          {d.name} ({d.code}) — {d.target_service_time}m SLA
                        </span>
                      ))}
                  </div>
                </div>

                {/* Data Initializer Status */}
                <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl sm:col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-xs font-bold text-sky-950">
                        {seedDemoVisits ? 'Demo Visits Seeder Active' : 'Clean Queue Initializer'}
                      </p>
                      <p className="text-[11px] text-sky-700">
                        {seedDemoVisits
                          ? '35 realistic patient visits will be loaded automatically into MongoDB.'
                          : 'Clinic starts fresh with 0 initial records.'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Ready</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                className="gap-1.5 shadow-md shadow-sky-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onboardingMutation.mutate()}
                loading={onboardingMutation.isPending}
                className="gap-2 shadow-lg shadow-sky-500/25 bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Clinic Flow Intelligence 🚀</span>
              </Button>
            )}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        CareQueue Operations Intelligence • Discrete-Event Waiting-Time Analytics
      </footer>
    </div>
  )
}
