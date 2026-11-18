import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import {
  BarChart3, TrendingUp, Sparkles, Filter, Layers,
  Calendar, Clock, Database, RefreshCw, CheckCircle2, AlertCircle,
  UploadCloud, Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoricalAnalyticsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    start_date: thirtyDaysAgo,
    end_date: today,
    metric: 'queue_wait',
    group_by: 'department',
  })
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/clinics/${clinicId}/analytics/historical/compute`, form)).data,
    onSuccess: data => {
      setResult(data)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Calculation failed')
    },
  })

  // Auto-compute on initial mount and when clinicId changes
  useEffect(() => {
    if (clinicId) {
      mutation.mutate()
    }
  }, [clinicId])

  const setPreset = (start: string) => {
    setForm(f => ({ ...f, start_date: start, end_date: today }))
  }

  const chartData =
    result?.breakdown?.map((b: any) => ({
      name: b.group_label?.length > 18 ? b.group_label.substring(0, 18) + '...' : b.group_label,
      fullName: b.group_label,
      value: b.stats?.mean || 0,
      median: b.stats?.median || 0,
      p90: b.stats?.p90 || 0,
      count: b.count,
    })) || []

  const distData =
    result?.distribution?.bins?.map((bin: any) => ({
      range: `${bin.min}-${bin.max}m`,
      count: bin.count,
      pct: bin.percentage ? `${bin.percentage.toFixed(1)}%` : '0%',
    })) || []

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historical Waiting-Time Analytics</h1>
            <Badge variant="info">Empirical Engine</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Compute empirical waiting-time distributions, median delays, and P90 compliance across departments & doctors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPreset(sevenDaysAgo)}
            className={`text-xs ${form.start_date === sevenDaysAgo ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold' : ''}`}
          >
            Last 7 Days
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPreset(thirtyDaysAgo)}
            className={`text-xs ${form.start_date === thirtyDaysAgo ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold' : ''}`}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* Query Parameters Filter Card */}
      <Card title="Analytics Filter & Statistical Grouping" className="border-slate-200 shadow-sm">
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
              <option value="registration_wait">Registration Wait (Arrival to Register)</option>
              <option value="service_time">Consultation / Service Duration</option>
              <option value="total_visit">Total Patient Clinic Stay</option>
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
              <option value="time_slot">By Hourly Time Slot</option>
              <option value="visit_type">By Patient Visit Type</option>
            </select>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Calculates empirical mean, median, P90 percentile & std deviation
          </span>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex items-center gap-2 shadow-md shadow-sky-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
            <span>Compute Metrics</span>
          </Button>
        </div>
      </Card>

      {/* Loading Skeleton */}
      {mutation.isPending && !result && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Computing empirical waiting distributions...</p>
        </div>
      )}

      {/* Zero Visits In Range - Helpful Actionable Empty State */}
      {result && result.total_visits === 0 && (
        <Card className="border-slate-200 shadow-sm py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Patient Visits Found in Selected Date Range</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            The active clinic does not have recorded outpatient visits between <strong>{form.start_date}</strong> and <strong>{form.end_date}</strong>.
            Upload an outpatient dataset or record patient arrivals to generate waiting-time metrics.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/data/import')}
              className="flex items-center gap-2 shadow-md shadow-sky-500/20"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset File</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/data/visits')}
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" />
              <span>Record Patient Visit</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Analytics Results Dashboard */}
      {result && result.total_visits > 0 && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="historical">Historical Sample</Badge>
              <span className="text-xs font-semibold text-slate-600">
                {result.total_visits} patient visits analyzed across interval
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Metric: <strong>{form.metric.replace('_', ' ').toUpperCase()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Mean Wait Time"
              value={result.summary?.mean != null ? `${result.summary.mean}` : '—'}
              unit="min"
              source="historical"
              trend={result.summary?.mean > 30 ? 'up' : 'flat'}
            />
            <KPICard
              title="Median Wait"
              value={result.summary?.median != null ? `${result.summary.median}` : '—'}
              unit="min"
              source="historical"
            />
            <KPICard
              title="P90 Maximum Wait"
              value={result.summary?.p90 != null ? `${result.summary.p90}` : '—'}
              unit="min"
              source="historical"
              subtitle="90% served under this duration"
            />
            <KPICard
              title="Sample Patients"
              value={result.total_visits}
              source="historical"
              subtitle="Validated OPD logs"
            />
          </div>

          {/* Charts Row: Bar Breakdown & Histogram Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Group Breakdown Bar Chart */}
            <div className="lg:col-span-2">
              <Card
                title={`Comparative ${form.metric === 'queue_wait' ? 'Queue Wait' : 'Duration'} by ${form.group_by.replace('_', ' ').toUpperCase()}`}
                subtitle="Empirical average duration per cohort"
                className="border-slate-200 shadow-sm"
              >
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        unit="m"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val} minutes`, 'Mean Duration']}
                      />
                      <Bar dataKey="value" fill="#0284C7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Right Col: Waiting Distribution Histogram */}
            <div className="lg:col-span-1">
              <Card
                title="Waiting Time Distribution"
                subtitle="Patient volume by duration bracket"
                className="border-slate-200 shadow-sm"
              >
                {distData.length > 0 ? (
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                          formatter={(v: any) => [`${v} patients`, 'Count']}
                        />
                        <Bar dataKey="count" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                    Distribution data not available
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Detailed Statistical Cohort Summary Table */}
          <Card title="Detailed Statistical Cohort Summary" className="border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cohort Label</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Sample Count</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Mean (Min)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Median (Min)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">P90 SLA (Min)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Std Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.breakdown?.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">{b.group_label}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{b.count}</td>
                      <td className="px-4 py-3 text-right font-bold text-sky-600 text-xs">{b.stats?.mean ?? '—'}m</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">{b.stats?.median ?? '—'}m</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-amber-600 font-bold">{b.stats?.p90 ?? '—'}m</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">{b.stats?.std ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
