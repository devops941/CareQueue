import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Download, FileSpreadsheet, Calendar, Filter, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const today = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [form, setForm] = useState({
    start_date: thirtyAgo,
    end_date: today,
    metric: 'queue_wait',
    group_by: 'department',
  })
  const [loading, setLoading] = useState('')

  const download = async (type: string, label: string) => {
    setLoading(type)
    try {
      const res = await apiClient.post(`/clinics/${clinicId}/reports/${type}`, form, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `carequeue_${type.replace('/', '-')}_${form.start_date}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${label} exported successfully!`)
    } catch (e: any) {
      toast.error('Failed to export report CSV')
      console.error(e)
    }
    setLoading('')
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports & Data Exports</h1>
          <Badge variant="info">CSV Exporter</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Generate waiting-time compliance summaries, department SLA breakdowns, and patient flow logs
        </p>
      </div>

      <Card title="Export Parameters & Aggregation Filter" className="border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Primary Metric
            </label>
            <select
              value={form.metric}
              onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="queue_wait">Queue Wait (Arrival to Call)</option>
              <option value="service_time">Consultation / Service Duration</option>
              <option value="total_visit">Total Clinic Stay</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Group Aggregation
            </label>
            <select
              value={form.group_by}
              onChange={e => setForm(f => ({ ...f, group_by: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              <option value="department">By Clinical Department</option>
              <option value="doctor">By Consulting Physician</option>
              <option value="day_of_week">By Day of Week</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Available Data Exports" className="border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 transition-colors shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Aggregated Analytics Summary</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Calculates mean wait, median, 90th percentile, and standard deviations grouped according to your filters.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format: CSV</span>
              <Button
                size="sm"
                onClick={() => download('analytics/csv', 'Analytics Summary')}
                loading={loading === 'analytics/csv'}
                className="flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Summary</span>
              </Button>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 transition-colors shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Patient Visit Flow Records</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Full patient-level log containing timestamps from arrival, registration, physician call, service start to exit.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format: CSV</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => download('visits/csv', 'Visit Records')}
                loading={loading === 'visits/csv'}
                className="flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Raw Visits</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
