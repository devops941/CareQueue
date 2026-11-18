import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, FileText, Check, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const VISIT_FIELDS = [
  'patient_token',
  'visit_date',
  'department_id',
  'arrival_time',
  'registration_time',
  'called_time',
  'service_start_time',
  'service_end_time',
  'departure_time',
  'visit_type',
]

export default function ImportPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dataset, setDataset] = useState<any>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('name', file.name)
      return (
        await apiClient.post(`/clinics/${clinicId}/datasets/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data
    },
    onSuccess: data => {
      setDataset(data)
      // Intelligent Auto-Mapping
      const autoMap: Record<string, string> = {}
      if (data.columns && Array.isArray(data.columns)) {
        data.columns.forEach((col: string) => {
          const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '_')
          if (norm.includes('token') || (norm.includes('patient') && norm.includes('id')) || norm === 'patient_token' || norm === 'mrn') {
            autoMap[col] = 'patient_token'
          } else if (norm.includes('arrival') || norm.includes('checkin') || norm.includes('check_in') || norm.includes('entered')) {
            autoMap[col] = 'arrival_time'
          } else if (norm.includes('reg')) {
            autoMap[col] = 'registration_time'
          } else if (norm.includes('call')) {
            autoMap[col] = 'called_time'
          } else if (norm.includes('service_start') || norm.includes('consult_start') || norm.includes('doctor_start')) {
            autoMap[col] = 'service_start_time'
          } else if (norm.includes('service_end') || norm.includes('consult_end') || norm.includes('doctor_end')) {
            autoMap[col] = 'service_end_time'
          } else if (norm.includes('depart') || norm.includes('checkout') || norm.includes('exit')) {
            autoMap[col] = 'departure_time'
          } else if (norm.includes('dept') || norm.includes('special')) {
            autoMap[col] = 'department_id'
          } else if (norm.includes('type') || norm.includes('category') || norm.includes('visit_type')) {
            autoMap[col] = 'visit_type'
          } else if (norm.includes('date') && !norm.includes('time')) {
            autoMap[col] = 'visit_date'
          }
        })
      }
      setMappings(autoMap)
      setStep(2)
      toast.success('File uploaded and columns auto-detected!')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to upload dataset')
    },
  })

  const previewMutation = useMutation({
    mutationFn: async () => {
      const effectiveMappings = { ...mappings }
      dataset?.columns?.forEach((col: string) => {
        if (!effectiveMappings[col]) {
          const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '_')
          const directMatch = VISIT_FIELDS.find(f => f.toLowerCase() === norm)
          if (directMatch) {
            effectiveMappings[col] = directMatch
          }
        }
      })
      const column_mappings = Object.entries(effectiveMappings)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ source_column: k, target_field: v }))
      return (
        await apiClient.post(`/clinics/${clinicId}/datasets/${dataset.id}/preview`, {
          column_mappings,
          timezone: 'Asia/Kolkata',
        })
      ).data
    },
    onSuccess: data => {
      setPreview(data)
      setStep(3)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Preview mapping failed')
    },
  })

  const commitMutation = useMutation({
    mutationFn: async () => {
      const effectiveMappings = { ...mappings }
      dataset?.columns?.forEach((col: string) => {
        if (!effectiveMappings[col]) {
          const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '_')
          const directMatch = VISIT_FIELDS.find(f => f.toLowerCase() === norm)
          if (directMatch) {
            effectiveMappings[col] = directMatch
          }
        }
      })
      const column_mappings = Object.entries(effectiveMappings)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ source_column: k, target_field: v }))
      return (
        await apiClient.post(`/clinics/${clinicId}/datasets/${dataset.id}/commit`, {
          column_mappings,
          timezone: 'Asia/Kolkata',
        })
      ).data
    },
    onSuccess: data => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['dashboard-kpi'] })
      toast.success(`Successfully imported ${data.valid_rows || 0} visits!`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Commit failed')
    },
  })

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import Clinic Historical Datasets</h1>
          <Badge variant="info">Batch Importer</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Upload outpatient logs (.csv, .xlsx) and map timestamp columns to CareQueue schema
        </p>
      </div>

      {/* Wizard Progress */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, label: 'Upload Dataset File' },
          { num: 2, label: 'Map Timestamp Columns' },
          { num: 3, label: 'Validate & Ingest' },
        ].map(s => (
          <div
            key={s.num}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
              step >= s.num
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                step >= s.num ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s.num}
            </div>
            <span className="text-xs font-bold truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card title="Step 1: Upload Raw Clinic Export" className="border-slate-200 shadow-sm">
          <div className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-2xl p-12 text-center bg-slate-50/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Select Outpatient Log File</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
              Supports CSV, Excel (.xlsx, .xls) files exported from clinic management software or HMS
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) uploadMutation.mutate(f)
                }}
                className="hidden"
              />
              <span className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-600/20 cursor-pointer hover:bg-sky-500 transition-colors">
                Browse Files
              </span>
            </label>
            {uploadMutation.isPending && (
              <p className="mt-4 text-xs font-semibold text-sky-600 animate-pulse">
                Parsing dataset structure and detecting column headers...
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Need ready-made sample data to test?</span>
              <a
                href="/samples/historical_dataset_for_import_module.csv"
                download="historical_dataset_for_import_module.csv"
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Download Sample Historical Dataset (.csv)</span>
              </a>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && dataset && (
        <Card
          title="Step 2: Map Columns to CareQueue Schema"
          subtitle={`File: ${dataset.original_filename} (${dataset.total_rows} rows)`}
          className="border-slate-200 shadow-sm"
        >
          <div className="space-y-3 pt-2">
            {dataset.columns?.map((col: string) => (
              <div
                key={col}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <span className="w-48 text-xs font-mono font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                  {col}
                </span>
                <span className="text-slate-400">→</span>
                <select
                  value={mappings[col] || (VISIT_FIELDS.includes(col) ? col : '')}
                  onChange={e => setMappings(m => ({ ...m, [col]: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  <option value="">— Skip / Ignore Column —</option>
                  {VISIT_FIELDS.map(f => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => previewMutation.mutate()}
              loading={previewMutation.isPending}
              className="flex items-center gap-2 shadow-md shadow-sky-500/20"
            >
              <span>Validate & Preview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && preview && !result && (
        <Card title="Step 3: Validation Assessment & Ingestion" className="border-slate-200 shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-2xl font-extrabold text-slate-900 block">{preview.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rows</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-2xl font-extrabold text-emerald-700 block">{preview.valid}</span>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Valid Rows</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-2xl font-extrabold text-rose-700 block">{preview.invalid}</span>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Validation Errors</span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
            {preview.rows?.slice(0, 25).map((r: any) => (
              <div
                key={r.row_number}
                className={`text-xs px-3.5 py-2 rounded-xl flex items-center justify-between border ${
                  r.is_valid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50/70 border-rose-200 text-rose-800'
                }`}
              >
                <span className="font-mono font-bold">Row #{r.row_number}</span>
                <span>{r.is_valid ? 'Timestamp valid' : r.validation_errors?.join(', ')}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back to Mapping
            </Button>
            <Button
              onClick={() => commitMutation.mutate()}
              loading={commitMutation.isPending}
              disabled={preview.valid === 0}
              className="shadow-md shadow-sky-500/20"
            >
              Commit Ingestion to Database
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card className="border-slate-200 shadow-sm">
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dataset Successfully Imported!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ingested {result.valid_rows || result.committed || 0} visit records into CareQueue. Real-time dashboards, historical metrics, and heatmap analyses have been refreshed.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null)
                  setPreview(null)
                  setDataset(null)
                  setStep(1)
                }}
              >
                Import Another Dataset
              </Button>
              <Button
                onClick={() => navigate('/data/visits')}
                className="shadow-md shadow-sky-500/20 flex items-center gap-2"
              >
                <span>View Ingested Visits in Visit Records</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
