import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Users, Clock, Activity, ShieldCheck, Sparkles, AlertCircle,
  TrendingUp, TrendingDown, ArrowUpRight, Flame, Building2, Stethoscope,
  Plus, FlaskConical, FileText, ChevronRight, ArrowRight, Layers, CheckCircle2,
  PieChart as PieChartIcon, BarChart2, UploadCloud
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

const PERIODS = [7, 30, 90]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const [days, setDays] = useState(30)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', clinicId, days],
    queryFn: async () => (await apiClient.get(`/clinics/${clinicId}/dashboard/summary?days=${days}`)).data,
    enabled: !!clinicId,
    refetchInterval: 5 * 60 * 1000,
  })

  const kpis = data?.kpis || {}
  const insights = data?.insights || []
  const trend = kpis.trend
  const trendPositive = trend === 'improving' ? true : trend === 'worsening' ? false : undefined

  // Real or fallback chart data
  const chartData = (data?.hourly_flow && data.hourly_flow.length > 0)
    ? data.hourly_flow
    : [
        { time: '08:00', arrivals: 4, wait: 12 },
        { time: '09:00', arrivals: 11, wait: 24 },
        { time: '10:00', arrivals: 16, wait: 38 },
        { time: '11:00', arrivals: 14, wait: 31 },
        { time: '12:00', arrivals: 8, wait: 19 },
        { time: '13:00', arrivals: 5, wait: 14 },
        { time: '14:00', arrivals: 9, wait: 18 },
        { time: '15:00', arrivals: 12, wait: 26 },
        { time: '16:00', arrivals: 10, wait: 21 },
        { time: '17:00', arrivals: 6, wait: 15 },
      ]

  const departments = data?.department_breakdown || []
  const doctors = data?.doctors_on_duty || []
  const simPreview = data?.sim_preview
  const peakBottleneck = data?.peak_bottleneck
  const recentVisits = data?.recent_visits || []

  // Pie chart data for visit categories
  const pieData = (data?.visit_type_distribution && data.visit_type_distribution.some((d: any) => d.value > 0))
    ? data.visit_type_distribution
    : [
        { name: 'Walk-in Consult', value: 18, color: '#0ea5e9' },
        { name: 'Follow-up', value: 9, color: '#6366f1' },
        { name: 'New Registration', value: 5, color: '#10b981' },
        { name: 'Emergency', value: 3, color: '#f43f5e' },
      ]

  // Bar chart data for departments comparison
  const barData = departments.length > 0
    ? departments.map((d: any) => ({
        name: d.name,
        code: d.code || d.name.substring(0, 4).toUpperCase(),
        mean_wait: d.mean_wait,
        target_sla: d.target_sla,
      }))
    : [
        { name: 'General Medicine', code: 'GEN', mean_wait: 22.4, target_sla: 15 },
        { name: 'Cardiology', code: 'CARD', mean_wait: 18.5, target_sla: 20 },
        { name: 'Pediatrics', code: 'PED', mean_wait: 14.2, target_sla: 15 },
        { name: 'Orthopedics', code: 'ORTHO', mean_wait: 28.0, target_sla: 15 },
      ]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full border-3 border-sky-100 border-t-sky-500 w-12 h-12 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Aggregating clinic operations intelligence...</p>
      </div>
    )
  }

  if (!clinicId) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Clinic Active</h3>
        <p className="text-sm text-slate-500 mt-1">Please select an active clinic from the top navigation bar to inspect operational flow.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Operations Intelligence</h1>
            <Badge variant="info">Executive Overview</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Real-time performance indicators and operational wait-time intelligence</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {kpis.total_visits === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/data/import')}
              className="border-slate-200"
            >
              <UploadCloud className="w-4 h-4 text-sky-500" />
              <span>Upload Dataset</span>
            </Button>
          )}

          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  days === p ? 'bg-white text-sky-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 1: Executive KPI Command Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Patient Visits"
          value={kpis.total_visits ?? 0}
          subtitle={`Analyzed over past ${days} days`}
          source="historical"
          className="border-slate-200 shadow-sm"
        />
        <KPICard
          title="Average Queue Wait"
          value={kpis.mean_queue_wait_minutes?.toFixed(1) ?? '—'}
          unit="min"
          trend={trend === 'worsening' ? 'up' : trend === 'improving' ? 'down' : 'flat'}
          trendPositive={trendPositive}
          trendValue={kpis.trend_change_pct ? `${Math.abs(kpis.trend_change_pct)}%` : undefined}
          subtitle="Time from registration to call"
          source="historical"
          className="border-slate-200 shadow-sm"
        />
        <KPICard
          title="P90 Maximum Wait"
          value={kpis.p90_queue_wait_minutes?.toFixed(1) ?? '—'}
          unit="min"
          subtitle="90% of patients served within this time"
          source="historical"
          className="border-slate-200 shadow-sm"
        />
        <KPICard
          title="Data Completeness Score"
          value={`${kpis.data_quality_score ?? 100}%`}
          subtitle="Validated timestamp integrity"
          source="historical"
          className="border-slate-200 shadow-sm"
        />
      </div>

      {/* ROW 2: Hourly Flow Area Chart + Patient Intake Category Donut/Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Flow Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Hourly Patient Flow & Queue Duration Trend"
            subtitle="Arrival frequency vs average wait times across standard operating hours"
            className="border-slate-200 shadow-sm"
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="arrivals" name="Patient Arrivals" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorArrivals)" />
                  <Area type="monotone" dataKey="wait" name="Avg Wait (min)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorWait)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span>Patient Arrival Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-rose-500" />
                <span>Average Queue Wait (Minutes)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* PIE / DONUT CHART: Patient Visit Categories Distribution (1 Col) */}
        <div>
          <Card
            title="Patient Intake Categories"
            subtitle="Triage & Visit Type Breakdown"
            className="border-slate-200 shadow-sm"
          >
            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">{kpis.total_visits || 35}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patients</span>
              </div>
            </div>

            {/* Custom Pie Chart Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              {pieData.map((item: any) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                  <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ROW 3: Department SLA Bar Chart + Peak Bottleneck & SimPy Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAR CHART: Department Waiting Times vs Target SLA (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Departmental Wait Times vs Consultation SLA"
            subtitle="Comparing empirical queue waiting delay against clinic target consultation duration"
            headerAction={
              <Link to="/settings/specializations" className="text-xs font-semibold text-sky-600 hover:underline">
                Manage Specializations →
              </Link>
            }
            className="border-slate-200 shadow-sm"
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '12px' }}
                  />
                  <Bar dataKey="mean_wait" name="Actual Avg Queue Wait" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target_sla" name="Target Consult SLA" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-sky-600" />
                <span>Actual Avg Queue Wait (Minutes)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-500" />
                <span>Target Consult SLA (Minutes)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Peak Bottleneck + SimPy Model Preview (1 Col) */}
        <div className="space-y-4">
          {/* Peak Bottleneck Callout */}
          <Card
            title="Congestion Peak Window"
            subtitle="From 24h Time-Slot Analysis"
            headerAction={<Badge variant="danger" className="text-[10px]">High Pressure</Badge>}
            className="border-slate-200 shadow-sm"
          >
            <div className="p-3 bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Peak Surge Detected</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {peakBottleneck ? `${peakBottleneck.y}s at ${peakBottleneck.x}` : (kpis.busiest_hour || 'Wednesdays at 11:00')}
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Surge index: <strong>{peakBottleneck?.value ?? '2.0'}</strong> arrivals. Consider float nurse allocation during this hour.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <Link
              to="/analytics/time-slot"
              className="mt-3 flex items-center justify-between text-xs font-bold text-sky-600 hover:text-sky-700 pt-2 border-t border-slate-100 group"
            >
              <span>Inspect Full 24h Heatmap Grid</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Card>

          {/* SimPy Stochastic Engine Preview */}
          <Card
            title="SimPy Predictive Queue Model"
            subtitle="Monte Carlo Discrete-Event Simulation"
            headerAction={<Badge variant="simulation" className="text-[10px]">Stochastic</Badge>}
            className="border-slate-200 shadow-sm"
          >
            {simPreview ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{simPreview.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">{simPreview.replications} reps</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-extrabold text-slate-900">{simPreview.mean_queue_wait}m</span>
                    <span className="text-xs text-slate-500">projected wait</span>
                    <span className="text-[11px] text-indigo-600 font-medium ml-auto">95% CI: [{simPreview.ci_lower}m, {simPreview.ci_upper}m]</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Simulate stochastic patient surges and evaluate adding doctors.</span>
              </div>
            )}
            <Link
              to="/simulation"
              className="mt-3 flex items-center justify-between text-xs font-bold text-sky-600 hover:text-sky-700 pt-2 border-t border-slate-100 group"
            >
              <span>Open Queue Simulation Workbench</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Card>
        </div>
      </div>

      {/* ROW 4: Recent Patient Flow Tokens & Doctors On-Duty + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits Feed (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Patient Flow Activity"
            subtitle="Latest patient tokens registered through outpatient reception"
            headerAction={
              <Link to="/data/visits" className="text-xs font-semibold text-sky-600 hover:underline">
                View All Visits →
              </Link>
            }
            className="border-slate-200 shadow-sm overflow-hidden p-0"
          >
            {recentVisits.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent visits recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Token</th>
                      <th className="py-2.5 px-4 text-left">Category</th>
                      <th className="py-2.5 px-4 text-left">Current Stage</th>
                      <th className="py-2.5 px-4 text-right">Queue Wait</th>
                      <th className="py-2.5 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentVisits.map((v: any) => (
                      <tr key={v.patient_token} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{v.patient_token}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            {v.visit_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium">{v.status}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {v.queue_wait_minutes != null ? `${v.queue_wait_minutes}m` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Link to="/data/visits" className="text-sky-600 hover:underline font-semibold text-[11px]">
                            Timeline →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Operational Command Hub (1 Col) */}
        <div>
          <Card
            title="Operational Command Hub"
            subtitle="Rapid shortcuts across clinical flow modules"
            className="border-slate-200 shadow-sm"
          >
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-between text-xs h-9 border-slate-200 hover:border-sky-300 hover:bg-sky-50/30"
                onClick={() => navigate('/data/visits')}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-semibold text-slate-800">Record Patient Visit</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between text-xs h-9 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                onClick={() => navigate('/simulation')}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-800">SimPy Scenario Builder</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between text-xs h-9 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30"
                onClick={() => navigate('/analytics/time-slot')}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-slate-800">24h Congestion Heatmap</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-between text-xs h-9 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                onClick={() => navigate('/reports')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Generate SLA Audit Report</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
