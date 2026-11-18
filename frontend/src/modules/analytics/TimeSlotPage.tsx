import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Calendar, Clock, AlertTriangle, Flame, BarChart3,
  TrendingUp, Sparkles, Filter, RefreshCw, UploadCloud, Plus
} from 'lucide-react'

export default function TimeSlotPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('cq_user') || '{}')
  const clinicId = user.clinic_id
  const qc = useQueryClient()

  const today = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    start_date: thirtyAgo,
    end_date: today,
    metric: 'count',
    slot_minutes: 60,
  })

  const [result, setResult] = useState<any>(null)
  const [activeCell, setActiveCell] = useState<{ day: string; slot: string; value: number; count?: number; isBneck?: boolean } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ day: string; slot: string; value: number; count?: number; isBneck?: boolean } | null>(null)

  const mutation = useMutation({
    mutationFn: async (payload?: typeof form) => {
      const body = payload || form
      return (await apiClient.post(`/clinics/${clinicId}/analytics/historical/heatmap`, body)).data
    },
    onSuccess: (data) => {
      setResult(data)
      setSelectedCell(null)
    },
  })

  // Auto-generate on mount if clinicId exists
  useEffect(() => {
    if (clinicId) {
      mutation.mutate(form)
    }
  }, [clinicId])

  const handlePreset = (start: string) => {
    const updated = { ...form, start_date: start, end_date: today }
    setForm(updated)
    mutation.mutate(updated)
  }

  const handleMetricChange = (metric: string) => {
    const updated = { ...form, metric }
    setForm(updated)
    mutation.mutate(updated)
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`) // 07:00 to 20:00

  const getValue = (slot: string, day: string) => {
    const cell = result?.data?.find((d: any) => d.x === slot && d.y === day)
    return cell?.value || 0
  }

  const getBottleneckInfo = (slot: string, day: string) => {
    return result?.bottlenecks?.find((b: any) => b.x === slot && b.y === day)
  }

  const maxVal = result && result.data && result.data.length > 0
    ? Math.max(...result.data.map((d: any) => d.value), 1)
    : 1

  const getCellBg = (val: number, isBneck: boolean) => {
    if (!val) return 'bg-slate-50 text-slate-300'
    const pct = val / maxVal
    if (isBneck) return 'bg-rose-500 text-white font-bold shadow-sm ring-2 ring-rose-300'
    if (pct > 0.75) return 'bg-sky-600 text-white font-semibold'
    if (pct > 0.50) return 'bg-sky-400 text-white'
    if (pct > 0.25) return 'bg-sky-200 text-sky-900'
    return 'bg-sky-50 text-sky-800'
  }

  const topBottleneck = result?.bottlenecks?.[0]
  const hasData = result && result.data && result.data.length > 0 && maxVal > 0

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time-Slot Congestion Analysis</h1>
            <Badge variant="info">24h Heatmap</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Analyze patient arrival distributions and pinpoint exact clinic bottleneck windows
          </p>
        </div>

        {/* Quick Date Range Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => handlePreset(sevenAgo)}
            className={`px-3 py-1.5 rounded-lg transition-all ${form.start_date === sevenAgo ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePreset(thirtyAgo)}
            className={`px-3 py-1.5 rounded-lg transition-all ${form.start_date === thirtyAgo ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="pl-3 pr-2 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="pl-3 pr-2 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Metric Variable
            </label>
            <select
              value={form.metric}
              onChange={e => handleMetricChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="count">Patient Arrival Volume</option>
              <option value="queue_wait">Queue Wait Duration (min)</option>
              <option value="service_time">Doctor Consultation Time (min)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={() => mutation.mutate(form)}
              loading={mutation.isPending}
              className="px-5 py-2 rounded-xl shadow-md shadow-sky-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update Heatmap</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Bottleneck Alert Ribbon */}
      {topBottleneck && (
        <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-200 flex items-center justify-center text-rose-600">
              <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                  Peak Bottleneck Detected
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {topBottleneck.y}s at {topBottleneck.x}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Congestion index: <strong>{topBottleneck.value}</strong> ({form.metric === 'count' ? 'patient arrivals' : 'min wait time'}). Staggering appointments or adding 1 triage nurse during this window reduces queue overflow.
              </p>
            </div>
          </div>
          <Badge variant="danger" className="hidden sm:inline-flex">High Pressure</Badge>
        </div>
      )}

      {/* Heatmap Grid Card */}
      <Card
        title="Weekly Service Demand Matrix"
        subtitle="Distribution across Operating Hours (07:00 – 20:00)"
        className="border-slate-200 shadow-sm"
        headerAction={
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>Low</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-sky-50 border border-slate-200" />
              <span className="w-4 h-4 rounded bg-sky-200" />
              <span className="w-4 h-4 rounded bg-sky-400" />
              <span className="w-4 h-4 rounded bg-sky-600" />
              <span className="w-4 h-4 rounded bg-rose-500" />
            </div>
            <span>Bottleneck</span>
          </div>
        }
      >
        {!hasData ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-sky-50 border border-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Historical Visits Found in Selected Range</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              The database does not have visits recorded for this clinic in the chosen date period. Upload an outpatient dataset or record patient arrivals to generate the congestion heatmap.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate('/data/import')} className="shadow-md shadow-sky-500/20">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Dataset File</span>
              </Button>
              <Button variant="secondary" onClick={() => navigate('/data/visits')} className="border-slate-200 hover:bg-slate-50">
                <Plus className="w-4 h-4" />
                <span>Record Patient Visit</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-xs border-separate border-spacing-1.5">
                <thead>
                  <tr>
                    <th className="w-24 text-left py-2 px-3 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      Day
                    </th>
                    {hours.map(slot => (
                      <th
                        key={slot}
                        className="text-center py-2 px-1 text-slate-500 font-semibold text-[11px] min-w-[50px]"
                      >
                        {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day}>
                      <td className="font-bold text-slate-700 px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-100">
                        {day.substring(0, 3)}
                      </td>
                      {hours.map(slot => {
                        const val = getValue(slot, day)
                        const bneck = getBottleneckInfo(slot, day)
                        const isSelected = selectedCell?.day === day && selectedCell?.slot === slot
                        return (
                          <td
                            key={slot}
                            onClick={() => setSelectedCell({ day, slot, value: val, isBneck: !!bneck })}
                            onMouseEnter={() => setActiveCell({ day, slot, value: val, isBneck: !!bneck })}
                            onMouseLeave={() => setActiveCell(null)}
                            className={`h-11 rounded-xl text-center cursor-pointer transition-all hover:scale-105 select-none ${getCellBg(val, !!bneck)} ${isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                          >
                            <span className="font-medium text-xs">
                              {val > 0 ? (form.metric === 'count' ? val : `${val}m`) : '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hover / Selected Tooltip Ribbon */}
            {(() => {
              const current = activeCell || selectedCell
              return (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                    {current ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          Time Slot: <strong className="text-slate-900">{current.day} at {current.slot}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          Value: <strong className="text-slate-900">{current.value} {form.metric === 'count' ? 'arrivals' : 'minutes'}</strong>
                        </span>
                        {current.isBneck && (
                          <Badge variant="danger" className="text-[10px] py-0 px-2">Peak Bottleneck</Badge>
                        )}
                        {selectedCell && !activeCell && (
                          <span className="text-[11px] text-slate-400 italic">(Pinned — click another cell to inspect)</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        Hover or click any cell in the grid to inspect exact patient load and wait times
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">Operating hours 07:00 – 20:00</span>
                </div>
              )
            })()}
          </div>
        )}
      </Card>

      {/* Bottlenecks Breakdown Table */}
      {hasData && result?.bottlenecks && result.bottlenecks.length > 0 && (
        <Card
          title="Congestion Ranking & Action Windows"
          subtitle="Top slots exceeding operational thresholds that require clinical flow adjustments"
          className="border-slate-200 shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Day of Week</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3 text-right">
                    {form.metric === 'count' ? 'Arrival Volume' : 'Avg Wait / Duration'}
                  </th>
                  <th className="py-2.5 px-3 text-center">Pressure Severity</th>
                  <th className="py-2.5 px-3">Clinical Action Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.bottlenecks.map((b: any, idx: number) => (
                  <tr key={`${b.y}-${b.x}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{b.y}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{b.x} – {String(parseInt(b.x.split(':')[0]) + 1).padStart(2, '0')}:00</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {b.value} {form.metric === 'count' ? 'patients' : 'min'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={b.severity === 'high' ? 'danger' : 'warning'} className="text-[10px]">
                        {b.severity === 'high' ? 'High Pressure' : 'Elevated'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {idx === 0
                        ? 'Deploy +1 float doctor or triage nurse; shift non-urgent follow-ups to afternoon.'
                        : 'Adjust appointment slots by 10-15m to flatten arrival surge.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
